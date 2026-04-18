import { useState, useEffect, useCallback } from "react";
import {
    Networks,
    BASE_FEE,
    TransactionBuilder,
    Contract,
    scValToNative,
    Keypair,
    Account,
    rpc,
    xdr,
} from "@stellar/stellar-sdk";
import {
    isConnected,
    getAddress,
    requestAccess,
    signTransaction,
} from "@stellar/freighter-api";

const RPC_URL = (import.meta as any).env.VITE_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK = Networks.TESTNET;
const server = new rpc.Server(RPC_URL);

export function useContract() {
    const contract = new Contract((import.meta as any).env.VITE_CONTRACT_ID || "");

    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);
    const [freighterInstalled, setFreighterInstalled] = useState(false);
    const [txLoading, setTxLoading] = useState(false);
    const [txError, setTxError] = useState<string | null>(null);
    const [txSuccess, setTxSuccess] = useState<string | null>(null);
    const [manuallyDisconnected, setManuallyDisconnected] = useState(
        () => typeof window !== "undefined" && localStorage.getItem("wallet_disconnected") === "true"
    );
    const [xlmBalance, setXlmBalance] = useState<string | null>(null);

    const isWalletConnected = !!publicKey;

    useEffect(() => {
        async function check() {
            try {
                const res = await isConnected();
                setFreighterInstalled(!!res);
                if (res && !manuallyDisconnected) {
                    const key = await getAddress();
                    if (key?.address) setPublicKey(key.address);
                }
            } catch {
                setFreighterInstalled(false);
            }
        }

        check();

        const interval = setInterval(async () => {
            try {
                const res = await isConnected();
                if (res && !manuallyDisconnected) {
                    const key = await getAddress();
                    if (key?.address) {
                        setPublicKey((prev) => {
                            if (prev !== key.address) return key.address;
                            return prev;
                        });
                    }
                } else if (!res) {
                    setPublicKey(null);
                }
            } catch {
                setPublicKey(null);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [manuallyDisconnected]);

    const connectWallet = useCallback(async () => {
        setWalletLoading(true);
        setWalletError(null);
        localStorage.removeItem("wallet_disconnected");
        setManuallyDisconnected(false);
        try {
            await requestAccess();
            const key = await getAddress();
            if (!key?.address) throw new Error("Failed to get public key");
            setPublicKey(key.address);
            return key.address;
        } catch (err: any) {
            setWalletError(err.message);
            throw err;
        } finally {
            setWalletLoading(false);
        }
    }, []);

    const disconnectWallet = useCallback(() => {
        localStorage.setItem("wallet_disconnected", "true");
        setManuallyDisconnected(true);
        setPublicKey(null);
        setWalletError(null);
        setTxError(null);
        setTxSuccess(null);
    }, []);

    const getXLMBalance = useCallback(async (address?: string) => {
        const addr = address || publicKey;
        if (!addr) return "0";
        try {
            const response = await fetch(
                `https://horizon-testnet.stellar.org/accounts/${addr}`
            );
            const data = await response.json();
            const balance = data.balances?.find((b: any) => b.asset_type === "native");
            return balance ? balance.balance : "0";
        } catch (err) {
            console.error("getXLMBalance error:", err);
            return "0";
        }
    }, [publicKey]);

    useEffect(() => {
        if (publicKey) {
            getXLMBalance(publicKey).then(setXlmBalance);
        } else {
            setXlmBalance(null);
        }
    }, [publicKey, getXLMBalance]);

    const readContract = useCallback(async (functionName: string, args: xdr.ScVal[] = []) => {
        try {
            const keypair = Keypair.random();
            const account = new Account(keypair.publicKey(), "0");

            const tx = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: NETWORK,
            })
                .addOperation(contract.call(functionName, ...args))
                .setTimeout(30)
                .build();

            const result = await server.simulateTransaction(tx);
            if (rpc.Api.isSimulationError(result)) throw new Error(result.error);

            return result.result?.retval ? scValToNative(result.result.retval) : null;
        } catch (err) {
            console.error(`readContract(${functionName}) error:`, err);
            throw err;
        }
    }, [contract]);

    const writeContract = useCallback(async (functionName: string, args: xdr.ScVal[] = []) => {
        if (!publicKey) throw new Error("Wallet not connected");
        setTxLoading(true);
        setTxError(null);
        setTxSuccess(null);
        try {
            const account = await server.getAccount(publicKey);
            const tx = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: NETWORK,
            })
                .addOperation(contract.call(functionName, ...args))
                .setTimeout(30)
                .build();

            const simResult = await server.simulateTransaction(tx);
            if (rpc.Api.isSimulationError(simResult)) throw new Error(simResult.error);

            const preparedTx = rpc.assembleTransaction(tx, simResult).build();

            const signResult: any = await signTransaction(preparedTx.toXDR(), {
                networkPassphrase: NETWORK,
            });
            if (signResult.error) throw new Error(signResult.error);

            const signedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, NETWORK);
            const submitResult = await server.sendTransaction(signedTx);
            if (submitResult.status === "ERROR") throw new Error("Submit failed: " + submitResult.errorResult);

            const confirmation = await waitConfirmation(submitResult.hash);
            
            // Extract return value from transaction results
            let returnValue = null;
            if (confirmation.resultMetaXdr) {
              const txMeta = xdr.TransactionMeta.fromXDR(confirmation.resultMetaXdr, "base64");
              const resVal = txMeta.v3().sorobanMeta().returnValue();
              returnValue = scValToNative(resVal);
            }

            setTxSuccess(confirmation.hash);
            return { ...confirmation, returnValue };
        } catch (err: any) {
            setTxError(err.message);
            throw err;
        } finally {
            setTxLoading(false);
        }
    }, [publicKey, contract]);

    async function waitConfirmation(hash: string, maxTry = 20) {
        for (let i = 0; i < maxTry; i++) {
            const res: any = await server.getTransaction(hash);
            if (res.status === "SUCCESS") {
              return { 
                success: true, 
                hash, 
                resultMetaXdr: res.resultMetaXdr 
              };
            }
            if (res.status === "FAILED") throw new Error("Transaction failed: " + hash);
            await new Promise((r) => setTimeout(r, 2000));
        }
        throw new Error("Transaction confirmation timeout");
    }

    return {
        publicKey,
        isWalletConnected,
        freighterInstalled,
        walletLoading,
        walletError,
        xlmBalance,
        getXLMBalance,
        connectWallet,
        disconnectWallet,
        readContract,
        writeContract,
        txLoading,
        txError,
        txSuccess,
    };
}
