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

        <Section header="Stellar Integration">
          <Cell>
            <div style={{ padding: '16px' }}>
              <Title level="3">Endereço Stellar</Title>
              <Text style={{ marginBottom: '8px' }}>Derivado da TON: {derivedStellarAddress}</Text>
              
              <Input
                header="Ou use um endereço personalizado:"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={stellarAddress}
                onChange={(e) => setStellarAddress(e.target.value)}
                style={{ marginBottom: '16px' }}
              />
              
              <Button
                size="s"
                onClick={handleGenerateNewKeypair}
                style={{ marginBottom: '16px', marginRight: '8px' }}
              >
                Gerar Novo Keypair
              </Button>
              
              <Button
                size="s"
                onClick={handleCheckBalances}
                disabled={isLoading}
                style={{ marginBottom: '16px' }}
              >
                {isLoading ? 'Verificando...' : 'Verificar Saldos'}
              </Button>
            </div>
          </Cell>
        </Section>

        {(testnetBalance !== null || mainnetBalance !== null) && (
          <DisplayData
            header="Saldos XLM"
            rows={[
              { title: 'Testnet', value: `${testnetBalance || '0'} XLM` },
              { title: 'Mainnet', value: `${mainnetBalance || '0'} XLM` },
            ]}
          />
        )}

        <Section header="Funding Testnet">
          <Cell>
            <div style={{ padding: '16px' }}>
              <Text style={{ marginBottom: '16px' }}>Adicione 10,000 XLM na testnet via Friendbot</Text>
              <Button
                size="s"
                onClick={handleFundTestnet}
                disabled={isLoading}
              >
                {isLoading ? 'Adicionando...' : 'Adicionar Fundos Testnet'}
              </Button>
            </div>
          </Cell>
        </Section>

        <Section header="Enviar XLM">
          <Cell>
            <div style={{ padding: '16px' }}>
              <Input
                header="Endereço de Destino:"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={sendToAddress}
                onChange={(e) => setSendToAddress(e.target.value)}
                style={{ marginBottom: '16px' }}
              />
              
              <Input
                header="Valor (XLM):"
                placeholder="10.5"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                style={{ marginBottom: '16px' }}
              />
              
              <Input
                header="Memo (opcional):"
                placeholder="Mensagem da transação"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                style={{ marginBottom: '16px' }}
              />
              
              <div style={{ marginBottom: '16px' }}>
                <Text>Rede:</Text>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Button
                    size="s"
                    mode={sendNetwork === 'testnet' ? 'filled' : 'outline'}
                    onClick={() => setSendNetwork('testnet')}
                  >
                    Testnet
                  </Button>
                  <Button
                    size="s"
                    mode={sendNetwork === 'mainnet' ? 'filled' : 'outline'}
                    onClick={() => setSendNetwork('mainnet')}
                  >
                    Mainnet
                  </Button>
                </div>
              </div>
              
              <Button
                size="s"
                onClick={handleSendXLM}
                disabled={isLoading || !sendToAddress || !sendAmount}
              >
                {isLoading ? 'Enviando...' : 'Enviar XLM'}
              </Button>
            </div>
          </Cell>
        </Section>

        {error && (
          <Section header="Erro">
            <Cell>
              <Text style={{ color: 'red', padding: '16px' }}>{error}</Text>
            </Cell>
          </Section>
        )}
      </List>
    </Page>
  );
};
