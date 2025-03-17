'use client';

import RiskBadge from './RiskBadge';
import AddressFormatter from './AddressFormatter';
import DateFormatter from './DateFormatter';

export default function TransactionsTable({ transactions, title = '最近交易' }) {
  const getChainName = (chainId) => {
    switch (chainId) {
      case '1':
        return '以太坊';
      case '56':
        return '币安智能链';
      case '137':
        return 'Polygon';
      case '42161':
        return 'Arbitrum';
      default:
        return chainId;
    }
  };

  const getCurrencySymbol = (chainId) => {
    switch (chainId) {
      case '1':
        return 'ETH';
      case '56':
        return 'BNB';
      case '137':
        return 'MATIC';
      case '42161':
        return 'ETH';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                交易哈希
              </th>
              <th scope="col" className="px-6 py-3">
                区块链
              </th>
              <th scope="col" className="px-6 py-3">
                发送方
              </th>
              <th scope="col" className="px-6 py-3">
                接收方
              </th>
              <th scope="col" className="px-6 py-3">
                金额
              </th>
              <th scope="col" className="px-6 py-3">
                时间
              </th>
              <th scope="col" className="px-6 py-3">
                风险等级
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions && transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.hash} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono">
                    <AddressFormatter address={tx.hash} />
                  </td>
                  <td className="px-6 py-4">
                    {getChainName(tx.chainId)}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    <AddressFormatter address={tx.from} />
                  </td>
                  <td className="px-6 py-4 font-mono">
                    <AddressFormatter address={tx.to} />
                  </td>
                  <td className="px-6 py-4">
                    {tx.value} {getCurrencySymbol(tx.chainId)}
                  </td>
                  <td className="px-6 py-4">
                    <DateFormatter timestamp={tx.timestamp} />
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level={tx.risk.level} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  暂无交易数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 