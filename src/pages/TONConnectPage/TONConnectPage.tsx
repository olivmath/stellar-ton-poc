import { openLink } from '@telegram-apps/sdk-react';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import {
  Avatar,
  Cell,
  List,
  Navigation,
  Placeholder,
  Section,
  Text,
  Title,
  Button,
  Input,
  Card,
} from '@telegram-apps/telegram-ui';
import type { FC } from 'react';
import { useState } from 'react';

import { DisplayData } from '@/components/DisplayData/DisplayData.tsx';
import { Page } from '@/components/Page.tsx';
import { bem } from '@/css/bem.ts';
import { useStellarTon } from '@/hooks/useStellarTon.ts';

import './TONConnectPage.css';

const [, e] = bem('ton-connect-page');

export const TONConnectPage: FC = () => {
  const wallet = useTonWallet();
  const {
    testnetBalance,
    mainnetBalance,
    isLoading,
    error,
    checkBalances,
    fundTestnet,
    sendXLM,
    generateStellarKeypair,
    getStellarAddressFromTonPublicKey,
  } = useStellarTon();

  const [stellarAddress, setStellarAddress] = useState<string>('');
  const [sendToAddress, setSendToAddress] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [sendNetwork, setSendNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [memo, setMemo] = useState<string>('');

  if (!wallet) {
    return (
      <Page>
        <Placeholder
          className={e('placeholder')}
          header="TON Connect"
          description={
            <>
              <Text>
                To display the data related to the TON Connect, it is required to connect your
                wallet
              </Text>
              <TonConnectButton className={e('button')}/>
            </>
          }
        />
      </Page>
    );
  }

  const {
    account: { chain, publicKey, address },
    device: {
      appName,
      appVersion,
      maxProtocolVersion,
      platform,
      features,
    },
  } = wallet;

  // Gera endereço Stellar baseado na chave pública TON
  const derivedStellarAddress = publicKey ? getStellarAddressFromTonPublicKey(publicKey) : '';

  const handleCheckBalances = async () => {
    const addressToCheck = stellarAddress || derivedStellarAddress;
    await checkBalances(addressToCheck);
  };

  const handleFundTestnet = async () => {
    const addressToFund = stellarAddress || derivedStellarAddress;
    await fundTestnet(addressToFund);
  };

  const handleSendXLM = async () => {
    if (!sendToAddress || !sendAmount) {
      alert('Por favor, preencha o endereço de destino e o valor');
      return;
    }
    
    const fromAddress = stellarAddress || derivedStellarAddress;
    await sendXLM({
      fromAddress,
      toAddress: sendToAddress,
      amount: sendAmount,
      network: sendNetwork,
      memo: memo || undefined,
    });
  };

  const handleGenerateNewKeypair = () => {
    const newKeypair = generateStellarKeypair();
    setStellarAddress(newKeypair.publicKey());
  };

  return (
    <Page>
      <List>
        {'imageUrl' in wallet && (
          <>
            <Section>
              <Cell
                before={
                  <Avatar src={wallet.imageUrl} alt="Provider logo" width={60} height={60}/>
                }
                after={<Navigation>About wallet</Navigation>}
                subtitle={wallet.appName}
                onClick={(e) => {
                  e.preventDefault();
                  openLink(wallet.aboutUrl);
                }}
              >
                <Title level="3">{wallet.name}</Title>
              </Cell>
            </Section>
            <TonConnectButton className={e('button-connected')}/>
          </>
        )}
        
        <DisplayData
          header="TON Account"
          rows={[
            { title: 'Address', value: address },
            { title: 'Chain', value: chain },
            { title: 'Public Key', value: publicKey },
          ]}
        />
        
        <DisplayData
          header="Device"
          rows={[
            { title: 'App Name', value: appName },
            { title: 'App Version', value: appVersion },
            { title: 'Max Protocol Version', value: maxProtocolVersion },
            { title: 'Platform', value: platform },
            {
              title: 'Features',
              value: features
                .map(f => typeof f === 'object' ? f.name : undefined)
                .filter(v => v)
                .join(', '),
            },
          ]}
        />

        {/* Dashboard de Saldos */}
        <Section header="💰 Saldos Stellar">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px' }}>
            <Card style={{ padding: '20px', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '12px' }}>
              <Title level="3" style={{ margin: '0 0 8px 0', color: 'white' }}>Testnet</Title>
              <Text style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                {testnetBalance !== null ? `${testnetBalance} XLM` : '-- XLM'}
              </Text>
            </Card>
            
            <Card style={{ padding: '20px', textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: '12px' }}>
              <Title level="3" style={{ margin: '0 0 8px 0', color: 'white' }}>Mainnet</Title>
              <Text style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                {mainnetBalance !== null ? `${mainnetBalance} XLM` : '-- XLM'}
              </Text>
            </Card>
          </div>
          
          <div style={{ padding: '0 16px 16px' }}>
            <Button 
              onClick={handleCheckBalances} 
              disabled={isLoading}
              style={{ 
                width: '100%', 
                marginBottom: '12px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              {isLoading ? '🔄 Verificando...' : '🔄 Atualizar Saldos'}
            </Button>
            
            <Button 
              onClick={handleFundTestnet}
              disabled={isLoading}
              style={{ 
                width: '100%',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              {isLoading ? '💧 Adicionando...' : '💧 Financiar Testnet (Friendbot)'}
            </Button>
          </div>
        </Section>
        
        {/* Seção de Endereços */}
        <Section header="🔑 Endereços Stellar">
          <Cell>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <Text style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Derivado da TON:</Text>
                <Text style={{ fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all' }}>
                  {derivedStellarAddress}
                </Text>
              </div>
              
              {stellarAddress && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#e8f5e8', borderRadius: '8px' }}>
                  <Text style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Customizado:</Text>
                  <Text style={{ fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all' }}>
                    {stellarAddress}
                  </Text>
                </div>
              )}
              
              <Input
                header="Ou use um endereço personalizado:"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={stellarAddress}
                onChange={(e) => setStellarAddress(e.target.value)}
                style={{ marginBottom: '16px' }}
              />
              
              <Button 
                onClick={handleGenerateNewKeypair}
                style={{ 
                  width: '100%',
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  border: 'none',
                  borderRadius: '8px'
                }}
              >
                🎲 Gerar Novo Keypair
              </Button>
            </div>
          </Cell>
        </Section>
        
        {/* Seção de Transações */}
        <Section header="💸 Enviar XLM">
          <div style={{ padding: '16px' }}>
            {/* Seletor de Rede */}
            <div style={{ marginBottom: '16px' }}>
              <Text style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Rede:</Text>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  onClick={() => setSendNetwork('testnet')}
                  style={{
                    flex: 1,
                    background: sendNetwork === 'testnet' ? '#667eea' : '#e9ecef',
                    color: sendNetwork === 'testnet' ? 'white' : '#495057',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  🧪 Testnet
                </Button>
                <Button
                  onClick={() => setSendNetwork('mainnet')}
                  style={{
                    flex: 1,
                    background: sendNetwork === 'mainnet' ? '#f5576c' : '#e9ecef',
                    color: sendNetwork === 'mainnet' ? 'white' : '#495057',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  🌐 Mainnet
                </Button>
              </div>
            </div>
            
            {/* Inputs de Transação */}
            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
              <Input
                header="📍 Endereço de Destino"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={sendToAddress}
                onChange={(e) => setSendToAddress(e.target.value)}
                style={{ marginBottom: '12px', borderRadius: '8px' }}
              />
              
              <Input
                header="💰 Quantidade (XLM)"
                placeholder="10.5"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                style={{ marginBottom: '12px', borderRadius: '8px' }}
              />
              
              <Input
                header="📝 Memo (opcional)"
                placeholder="Descrição da transação"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                style={{ marginBottom: '0', borderRadius: '8px' }}
              />
            </div>
            
            <Button 
              onClick={handleSendXLM}
              disabled={isLoading || !sendToAddress || !sendAmount}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {isLoading ? '🚀 Enviando...' : '🚀 Enviar XLM'}
            </Button>
          </div>
        </Section>

        {/* Status e Erros */}
        {error && (
          <Section>
            <Cell>
              <div style={{ 
                padding: '16px', 
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', 
                borderRadius: '12px',
                margin: '16px'
              }}>
                <Text style={{ color: '#721c24', fontWeight: 'bold' }}>❌ Erro:</Text>
                <Text style={{ color: '#721c24', marginTop: '4px' }}>{error}</Text>
              </div>
            </Cell>
          </Section>
        )}
      </List>
    </Page>
  );
};
