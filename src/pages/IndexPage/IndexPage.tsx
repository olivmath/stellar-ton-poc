import { Section, Cell, Image, List, Button, Input, Card, Badge, Spinner } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';

import { Link } from '@/components/Link/Link.tsx';
import { Page } from '@/components/Page.tsx';
import { useStellarTon } from '@/hooks/useStellarTon.ts';

import tonSvg from './ton.svg';

export const IndexPage: FC = () => {
  const wallet = useTonWallet();
  const {
    testnetBalance,
    mainnetBalance,
    isLoading,
    error,
    checkBalances,
    fundTestnet,
    sendXLM,
    getStellarAddressFromTonPublicKey
  } = useStellarTon();

  const [stellarAddress, setStellarAddress] = useState<string>('');
  const [transactionForm, setTransactionForm] = useState({
    toAddress: '',
    amount: '',
    network: 'testnet' as 'testnet' | 'mainnet',
    memo: ''
  });
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Gera endereço Stellar quando wallet TON é conectada
  useEffect(() => {
    if (wallet?.account?.publicKey) {
      const address = getStellarAddressFromTonPublicKey(wallet.account.publicKey);
      setStellarAddress(address);
      checkBalances(address);
    }
  }, [wallet, getStellarAddressFromTonPublicKey, checkBalances]);

  const handleFundTestnet = async () => {
    if (stellarAddress) {
      await fundTestnet(stellarAddress);
    }
  };

  const handleSendTransaction = async () => {
    if (!stellarAddress || !transactionForm.toAddress || !transactionForm.amount) {
      return;
    }

    try {
      await sendXLM({
        fromAddress: stellarAddress,
        toAddress: transactionForm.toAddress,
        amount: transactionForm.amount,
        network: transactionForm.network,
        memo: transactionForm.memo
      });
      
      // Limpa o formulário após sucesso
      setTransactionForm({
        toAddress: '',
        amount: '',
        network: 'testnet',
        memo: ''
      });
      setShowTransactionForm(false);
    } catch (err) {
      console.error('Erro ao enviar transação:', err);
    }
  };

  const formatBalance = (balance: string | null) => {
    if (!balance) return '0.00';
    return parseFloat(balance).toFixed(2);
  };

  return (
    <Page back={false}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Card de Conexão TON */}
        <Card>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Image src={tonSvg} style={{ backgroundColor: '#007AFF', width: '40px', height: '40px' }}/>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>TON Wallet</h3>
                <p style={{ margin: 0, color: 'var(--tgui--hint_color)', fontSize: '14px' }}>
                  {wallet ? `Conectado: ${wallet.account.address.slice(0, 8)}...` : "Conectar sua carteira"}
                </p>
              </div>
              {wallet && <Badge type="number" mode="primary">✓</Badge>}
            </div>
            {!wallet && (
              <Link to="/ton-connect">
                <Button size="m" mode="filled" style={{ width: '100%' }}>
                  🔗 Conectar Carteira
                </Button>
              </Link>
            )}
          </div>
        </Card>

        {/* Card de Saldos */}
        {wallet && stellarAddress && (
          <Card>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>💰 Seus Saldos</h3>
                <p style={{ margin: 0, color: 'var(--tgui--hint_color)', fontSize: '12px' }}>
                  {stellarAddress.slice(0, 12)}...{stellarAddress.slice(-12)}
                </p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: 'var(--tgui--secondary_bg_color)', 
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                    {formatBalance(testnetBalance)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--tgui--hint_color)', marginBottom: '8px' }}>XLM</div>
                  <Badge type="number" mode="secondary">🧪 Testnet</Badge>
                  {isLoading && <Spinner size="s" style={{ marginLeft: '8px' }} />}
                </div>
                
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: 'var(--tgui--secondary_bg_color)', 
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                    {formatBalance(mainnetBalance)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--tgui--hint_color)', marginBottom: '8px' }}>XLM</div>
                  <Badge type="number" mode="primary">🌐 Mainnet</Badge>
                  {isLoading && <Spinner size="s" style={{ marginLeft: '8px' }} />}
                </div>
              </div>
              
              <Button 
                size="s" 
                mode="outline" 
                onClick={() => stellarAddress && checkBalances(stellarAddress)}
                style={{ width: '100%', marginTop: '16px' }}
              >
                🔄 Atualizar Saldos
              </Button>
            </div>
          </Card>
        )}

        {/* Card de Ações */}
        {wallet && stellarAddress && (
          <Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>⚡ Ações Rápidas</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button 
                  size="m" 
                  mode="filled" 
                  onClick={handleFundTestnet}
                  style={{ width: '100%' }}
                >
                  🚰 Adicionar Fundos (Testnet)
                </Button>
                
                <Button 
                  size="m" 
                  mode="outline" 
                  onClick={() => setShowTransactionForm(!showTransactionForm)}
                  style={{ width: '100%' }}
                >
                  💸 Enviar Transação
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Card de Formulário de Transação */}
        {showTransactionForm && wallet && (
          <Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>📤 Enviar Transação</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input
                  header="Endereço de Destino"
                  placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={transactionForm.toAddress}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, toAddress: e.target.value }))}
                />
                
                <Input
                  header="Quantidade (XLM)"
                  placeholder="10.00"
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                />
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Rede</label>
                  <select
                    value={transactionForm.network}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, network: e.target.value as 'testnet' | 'mainnet' }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--tgui--outline)',
                      backgroundColor: 'var(--tgui--secondary_bg_color)',
                      color: 'var(--tgui--text_color)'
                    }}
                  >
                    <option value="testnet">🧪 Testnet</option>
                    <option value="mainnet">🌐 Mainnet</option>
                  </select>
                </div>
                
                <Input
                  header="Memo (Opcional)"
                  placeholder="Nota da transação"
                  value={transactionForm.memo}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, memo: e.target.value }))}
                />
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Button
                    size="m"
                    mode="filled"
                    onClick={handleSendTransaction}
                    disabled={!transactionForm.toAddress || !transactionForm.amount || isLoading}
                    style={{ flex: 1 }}
                  >
                    {isLoading ? 'Enviando...' : '💸 Enviar'}
                  </Button>
                  <Button
                    size="m"
                    mode="outline"
                    onClick={() => setShowTransactionForm(false)}
                    style={{ flex: 1 }}
                  >
                    ❌ Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Card de Erro */}
        {error && (
          <Card>
            <div style={{
              padding: '20px',
              backgroundColor: 'var(--tgui--destructive_text_color)',
              color: 'white',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
              <div style={{ fontWeight: '500' }}>{error}</div>
            </div>
          </Card>
        )}

      </div>
    </Page>
  );
};
