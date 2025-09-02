import { useState, useCallback, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import {
  Keypair,
  TransactionBuilder,
  Networks,
  Asset,
  Operation,
  Account,
  Horizon,
} from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';

const { Server } = Horizon;

export interface StellarBalance {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

export interface StellarAccount {
  id: string;
  balances: StellarBalance[];
  sequence: string;
}

export interface UseStellarTonReturn {
  // Estados
  testnetBalance: string | null;
  mainnetBalance: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Funções
  checkBalances: (stellarAddress: string) => Promise<void>;
  fundTestnet: (stellarAddress: string) => Promise<void>;
  sendXLM: (params: {
    fromAddress: string;
    toAddress: string;
    amount: string;
    network: 'testnet' | 'mainnet';
    memo?: string;
  }) => Promise<void>;
  signStellarTransaction: (params: {
    fromAddress: string;
    toAddress: string;
    amount: string;
    network: 'testnet' | 'mainnet';
    memo?: string;
  }) => Promise<string>;
  sendSignedTransaction: (signedXDR: string, network: 'testnet' | 'mainnet') => Promise<void>;
  
  // Utilitários
  generateStellarKeypair: () => Keypair;
  getStellarAddressFromTonPublicKey: (tonPublicKey: string) => string;
}

const TESTNET_SERVER = new Server('https://horizon-testnet.stellar.org');
const MAINNET_SERVER = new Server('https://horizon.stellar.org');
const FRIENDBOT_URL = 'https://friendbot.stellar.org';

export const useStellarTon = (): UseStellarTonReturn => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  
  const [testnetBalance, setTestnetBalance] = useState<string | null>(null);
  const [mainnetBalance, setMainnetBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gera um novo keypair Stellar
  const generateStellarKeypair = useCallback((): Keypair => {
    return Keypair.random();
  }, []);

  // Converte chave pública TON para endereço Stellar (simulado)
  const getStellarAddressFromTonPublicKey = useCallback((tonPublicKey: string): string => {
    // Para este PoC, vamos gerar um keypair determinístico baseado na chave TON
    // Em produção, você implementaria uma conversão real ou mapeamento
    
    // Criar um seed de 32 bytes a partir da chave TON
    const seedString = tonPublicKey.slice(0, 64).padEnd(64, '0');
    const seedBuffer = Buffer.from(seedString, 'hex');
    
    // Garantir que temos exatamente 32 bytes
    const seed32Bytes = seedBuffer.subarray(0, 32);
    
    const keypair = Keypair.fromRawEd25519Seed(seed32Bytes);
    return keypair.publicKey();
  }, []);

  // Verifica saldos nas duas redes
  const checkBalances = useCallback(async (stellarAddress: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Verifica saldo na testnet
      try {
        const testnetAccount = await TESTNET_SERVER.loadAccount(stellarAddress);
        const testnetXLMBalance = testnetAccount.balances.find(
          (balance: any) => balance.asset_type === 'native'
        );
        setTestnetBalance(testnetXLMBalance?.balance || '0');
      } catch (testnetError) {
        console.log('Conta não encontrada na testnet:', testnetError);
        setTestnetBalance('0');
      }

      // Verifica saldo na mainnet
      try {
        const mainnetAccount = await MAINNET_SERVER.loadAccount(stellarAddress);
        const mainnetXLMBalance = mainnetAccount.balances.find(
          (balance: any) => balance.asset_type === 'native'
        );
        setMainnetBalance(mainnetXLMBalance?.balance || '0');
      } catch (mainnetError) {
        console.log('Conta não encontrada na mainnet:', mainnetError);
        setMainnetBalance('0');
      }
    } catch (err) {
      setError(`Erro ao verificar saldos: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Adiciona fundos na testnet via Friendbot
  const fundTestnet = useCallback(async (stellarAddress: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${FRIENDBOT_URL}?addr=${stellarAddress}`);
      
      if (!response.ok) {
        throw new Error(`Erro do Friendbot: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Funding successful:', result);
      
      // Atualiza o saldo após o funding
      await checkBalances(stellarAddress);
    } catch (err) {
      setError(`Erro ao adicionar fundos: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [checkBalances]);

  // Envia XLM usando TON wallet para assinar
  const sendXLM = useCallback(async (params: {
    fromAddress: string;
    toAddress: string;
    amount: string;
    network: 'testnet' | 'mainnet';
    memo?: string;
  }) => {
    if (!wallet) {
      throw new Error('TON wallet não conectada');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const server = params.network === 'testnet' ? TESTNET_SERVER : MAINNET_SERVER;
      const networkPassphrase = params.network === 'testnet' 
        ? Networks.TESTNET 
        : Networks.PUBLIC;

      // Carrega a conta de origem
      const sourceAccount = await server.loadAccount(params.fromAddress);
      
      // Constrói a transação
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100000', // 0.01 XLM
        networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: params.toAddress,
            asset: Asset.native(),
            amount: params.amount,
          })
        )
        .setTimeout(30)
        .build();

      // Prepara a transação para assinatura
      const transactionXDR = transaction.toXDR();
      
      // Usa TON Connect para assinar a transação
      // Nota: Isso é uma simulação - TON Connect não assina transações Stellar diretamente
      // Em uma implementação real, você precisaria de um bridge ou converter a assinatura
      const tonTransaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutos
        messages: [{
          address: params.toAddress,
          amount: (parseFloat(params.amount) * 10000000).toString(), // Converte para stroops
          payload: transactionXDR,
        }]
      };

      const result = await tonConnectUI.sendTransaction(tonTransaction);
      console.log('Transação TON enviada:', result);
      
      // Para este PoC, vamos simular o envio da transação Stellar
      // Em produção, você extrairia a assinatura do resultado TON e aplicaria à transação Stellar
      console.log('Transação Stellar simulada:', transactionXDR);
      
      // Atualiza os saldos após a transação
      await checkBalances(params.fromAddress);
      
    } catch (err) {
      setError(`Erro ao enviar XLM: ${err}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, tonConnectUI, checkBalances]);

  // Assina transação Stellar usando TON Connect signData
  const signStellarTransaction = useCallback(async (params: {
    fromAddress: string;
    toAddress: string;
    amount: string;
    network: 'testnet' | 'mainnet';
    memo?: string;
  }): Promise<string> => {
    if (!wallet) {
      throw new Error('TON wallet não conectada');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const server = params.network === 'testnet' ? TESTNET_SERVER : MAINNET_SERVER;
      const networkPassphrase = params.network === 'testnet' 
        ? Networks.TESTNET 
        : Networks.PUBLIC;

      // Carrega a conta de origem
      const sourceAccount = await server.loadAccount(params.fromAddress);
      
      // Constrói a transação
      let transactionBuilder = new TransactionBuilder(sourceAccount, {
        fee: '100000', // 0.01 XLM
        networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: params.toAddress,
            asset: Asset.native(),
            amount: params.amount,
          })
        )
        .setTimeout(30);

      // Adiciona memo se fornecido
      if (params.memo) {
        transactionBuilder = transactionBuilder.addMemo({
          type: 'text',
          value: params.memo
        } as any);
      }

      const transaction = transactionBuilder.build();

      // Converte a transação para hash que será assinado
      const transactionHash = transaction.hash();
      
      // Converte o hash para string hexadecimal para assinatura
      const hashHex = transactionHash.toString('hex');
      
      console.log('Hash da transação Stellar:', hashHex);
      
      // Usa TON Connect signData para assinar o hash da transação
      const signResult = await tonConnectUI.signData({
        type: 'binary',
        bytes: hashHex
      });
      
      console.log('Resultado da assinatura TON:', signResult);
       
       // Aplica a assinatura à transação Stellar
       // A assinatura TON usa Ed25519, mesmo algoritmo que Stellar
       // Precisamos converter o formato da assinatura
       const tonSignature = signResult.signature;
       const tonAddress = signResult.address;
       
       console.log('Assinatura TON:', tonSignature);
       console.log('Endereço TON:', tonAddress);
       
       // Converte a chave pública TON para formato Stellar
        // Nota: Isso é uma simplificação - em produção você precisaria
        // implementar a conversão correta entre os formatos de chave
        const tonPublicKey = wallet.account.publicKey || '';
        const stellarPublicKey = getStellarAddressFromTonPublicKey(tonPublicKey);
        const stellarKeypair = Keypair.fromPublicKey(stellarPublicKey);
       
       // Cria uma assinatura Stellar usando os dados da assinatura TON
       // Em uma implementação real, você converteria a assinatura TON diretamente
       // Para este PoC, vamos usar a assinatura TON como base
       try {
         // Aplica a assinatura convertida à transação
         // Nota: Esta é uma simulação - a conversão real seria mais complexa
         const signatureBuffer = Buffer.from(tonSignature, 'base64');
         
         // Para demonstração, vamos assinar com um keypair derivado
         // Em produção, você aplicaria a assinatura TON convertida
         transaction.sign(stellarKeypair);
         
         console.log('Transação assinada com sucesso');
       } catch (signError) {
         console.warn('Erro ao aplicar assinatura, usando assinatura simulada:', signError);
         // Fallback: assina com keypair derivado
         transaction.sign(stellarKeypair);
       }
       
       // Retorna o XDR da transação assinada
       const signedTransactionXDR = transaction.toXDR();
      
      console.log('Transação Stellar assinada (simulada):', signedTransactionXDR);
      
      return signedTransactionXDR;
      
    } catch (err) {
      setError(`Erro ao assinar transação: ${err}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, tonConnectUI]);

  // Envia transação assinada para a rede Stellar
  const sendSignedTransaction = useCallback(async (signedXDR: string, network: 'testnet' | 'mainnet') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const server = network === 'testnet' ? TESTNET_SERVER : MAINNET_SERVER;
      
      // Reconstrói a transação a partir do XDR
      const transaction = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET);
      
      // Envia a transação para a rede
      const result = await server.submitTransaction(transaction);
      
      console.log('Transação enviada com sucesso:', result);
      console.log('Hash da transação:', result.hash);
      
    } catch (err) {
      setError(`Erro ao enviar transação: ${err}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    testnetBalance,
    mainnetBalance,
    isLoading,
    error,
    checkBalances,
    fundTestnet,
    sendXLM,
    signStellarTransaction,
    sendSignedTransaction,
    generateStellarKeypair,
    getStellarAddressFromTonPublicKey,
  };
};