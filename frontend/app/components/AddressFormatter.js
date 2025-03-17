"use client";

export default function AddressFormatter({ address, prefixLength = 6, suffixLength = 4 }) {
  if (!address) return null;
  
  const formatAddress = (address) => {
    if (address.length <= prefixLength + suffixLength) {
      return address;
    }
    return `${address.substring(0, prefixLength)}...${address.substring(
      address.length - suffixLength
    )}`;
  };

  return (
    <span className="font-mono text-xs">
      {formatAddress(address)}
    </span>
  );
} 