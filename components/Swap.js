import { useState, useEffect } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import {
    bttAddresses,
    bttDexAbi,
    bttPool,
    bttPoolToken,
} from "@/constants/btt-dex-constant"

const Swap = () => {
    const { chainId: chainIdHex, isWeb3Enabled, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const [selectedPool, setSelectedPool] = useState("")
    const [pools, setPools] = useState([])
    const [token1Address, setToken1Address] = useState("")
    const [token2Address, setToken2Address] = useState("")
    const [amount, setAmount] = useState("0")
    const [token1Balance, settoken1Balance] = useState("0")
    const [token2Balance, settoken2Balance] = useState("0")
    const [liquidityToken1Balance, setLiquidityToken1Balance] = useState("0")
    const [liquidityToken2Balance, setLiquidityToken2Balance] = useState("0")
    const [expectedAmountOut, setExpectedAmountOut] = useState("0")
    const [tokens, setTokens] = useState([])
    const bttContractAddress =
        chainId in bttAddresses ? bttAddresses[chainId].bttSwap : null

    const { runContractFunction: getPairs } = useWeb3Contract({
        abi: bttDexAbi,
        contractAddress: bttContractAddress,
        functionName: "getPairs",
    })

    const { runContractFunction: getToken1 } = useWeb3Contract({
        abi: bttPool,
        functionName: "token1",
    })

    const { runContractFunction: getToken2 } = useWeb3Contract({
        abi: bttPool,
        functionName: "token2",
    })

    const { runContractFunction: getExpectedAmountOut } = useWeb3Contract({
        abi: bttPool,
        functionName: "expectedAmountOut",
    })

    const { runContractFunction: swapTokens } = useWeb3Contract({
        abi: bttPool,
        functionName: "swapTokens",
    })

    const { runContractFunction: getAllowance } = useWeb3Contract({
        abi: bttPoolToken,
        functionName: "allowance",
    })

    const { runContractFunction: approve } = useWeb3Contract({
        abi: bttPoolToken,
        functionName: "approve",
    })

    const { runContractFunction: getBalanceOf } = useWeb3Contract({
        abi: bttPoolToken,
        functionName: "balanceOf",
    })

    useEffect(() => {
        if (isWeb3Enabled) {
            const fetchPools = async () => {
                const pairs = await getPairs()
                if (pairs) {
                    setPools(pairs)
                    if (pairs.length > 0) {
                        setSelectedPool(pairs[0])
                    }
                }
            }
            fetchPools()
        }
    }, [isWeb3Enabled])

    useEffect(() => {
        if (selectedPool) {
            const fetchTokens = async () => {
                const token1Address = await getToken1({
                    params: {
                        contractAddress: selectedPool,
                    },
                })

                const token2Address = await getToken2({
                    params: {
                        contractAddress: selectedPool,
                    },
                })
                setToken1Address(token1Address)
                setToken2Address(token2Address)
                setTokens([token1Address, token2Address])
            }
            fetchTokens()
        }
    }, [selectedPool])

    useEffect(() => {
        if(token1Address && token2Address && selectedPool){
            const fetchTokenAmount = async() => {
                const balanceToken1 = await getBalanceOf({
                    params: {
                        contractAddress: token1Address,
                        params: {
                            account: account,
                        }
                    },
                })
                
                const balanceToken2 = await getBalanceOf({
                    params: {
                        contractAddress: token2Address,
                        params: {
                            account: account,
                        }
                    },
                })

                const lpBalanceToken1 = await getBalanceOf({
                    params: {
                        contractAddress: token1Address,
                        params: {
                            account: selectedPool,
                        }
                    },
                })
                
                const lpBalanceToken2 = await getBalanceOf({
                    params: {
                        contractAddress: token2Address,
                        params: {
                            account: selectedPool,
                        }
                    },
                })
                settoken1Balance(ethers.utils.formatEther(balanceToken1))
                settoken2Balance(ethers.utils.formatEther(balanceToken2))
                setLiquidityToken1Balance(ethers.utils.formatEther(lpBalanceToken1))
                setLiquidityToken2Balance(ethers.utils.formatEther(lpBalanceToken2))
            }
            fetchTokenAmount()
        }
    }, [token1Address])

    const handleSwap = async () => {
        try {
            const isTokenApproved = await checkAllowance(
                token1Address,
                account,
                selectedPool,
                ethers.utils.parseEther(amount)
            )
            if (!isTokenApproved) {
                await requestApprovals(
                    isTokenApproved,
                    token1Address,
                    token2Address,
                    selectedPool,
                    ethers.utils.parseEther(amount),
                    ethers.utils.parseEther(expectedAmountOut)
                )
            } else {
                await triggerSwap(
                    token1Address,
                    token2Address,
                    ethers.utils.parseEther(amount),
                    ethers.utils.parseEther(expectedAmountOut)
                )
            }
        } catch (error) {
            console.log(error)
        }
    }

    const checkAllowance = async (tokenAddress, owner, spender, amount) => {
        // console.log("1", tokenAddress, "2", owner, "3", spender, "4", amount)
        const allowance = await getAllowance({
            params: {
                contractAddress: tokenAddress,
                params: {
                    owner: owner,
                    spender: spender,
                },
            },
        })
        console.log(allowance)
        if (allowance.gt(amount)) {
            return true
        }
        return false
    }

    const requestApprovals = async (
        isToken1Approved,
        token1Address,
        token2Address,
        spender,
        amountToken1,
        amountToken2
    ) => {
        try {
            if (isToken1Approved) {
                await approve({
                    params: {
                        contractAddress: token1Address,
                        params: {
                            spender: spender,
                            value: amountToken1,
                        },
                    },
                })
            }
            await triggerSwap(
                token1Address,
                token2Address,
                ethers.utils.parseEther(amountToken1),
                ethers.utils.parseEther(amountToken2)
            )
        } catch (error) {
            console.log(error)
        }
    }

    const triggerSwap = async (
        token1address,
        token2Address,
        amountIn,
        amountOut
    ) => {
        try {
            await swapTokens({
                params: {
                    constractAddress: selectedPool,
                    params: {
                        fromToken: token1address,
                        toToken: token2Address,
                        amountIn: amountIn,
                        amountOut: amountOut,
                    },
                },
                onError: (e) => console.log(e),
            })
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="mt-8 p-8 bg-white rounded-lg shadow-md max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Swap</h2>
            {isWeb3Enabled && bttContractAddress != null ? (
                <div>
                    <p className="mb-4">환영합니다!, {account}!</p>

                    <div className="mb-4">
                        <label className="text-sm font-bold">
                            생성된 풀 목록:
                        </label>
                        <select
                            value={selectedPool}
                            onChange={(e) => {
                                setSelectedPool(e.target.value)
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        >
                            {pools.map((pool) => (
                                <option key={pool} value={pool}>
                                    {pool}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="text-sm font-bold">Token From:</label>
                        <select
                            value={token1Address}
                            onChange={(e) => {
                                if (tokens && tokens.length > 0) {
                                    setToken1Address(e.target.value)
                                    if (tokens[0] == e.target.value) {
                                        setToken2Address(tokens[1])
                                    } else {
                                        setToken2Address(tokens[0])
                                    }
                                }
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        >
                            {tokens.map((token) => (
                                <option key={token} value={token}>
                                    {token}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="text-sm font-bold">Token To:</label>
                        <select
                            value={token2Address}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            disabled={true}
                        >
                            {tokens.map((token) => (
                                <option key={token} value={token}>
                                    {token}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="text-sm font-bold">스왑수량:</label>
                        <input
                            value={amount}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            onChange={async (e) => {
                                setAmount(e.target.value)
                                if (e.target.value > 0 && selectedPool) {
                                    const estimatedAmount =
                                        await getExpectedAmountOut({
                                            params: {
                                                contractAddress: selectedPool,
                                                params: {
                                                    amountIn:
                                                        ethers.utils.parseEther(
                                                            e.target.value
                                                        ),
                                                    fromToken: token1Address,
                                                },
                                            },
                                        })
                                    setExpectedAmountOut(
                                        ethers.utils.formatEther(
                                            estimatedAmount
                                        )
                                    )
                                } else {
                                    setExpectedAmountOut("0")
                                }
                            }}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-sm font-bold">
                            스왑 후 예상수량:
                        </label>
                        <input
                            value={expectedAmountOut}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            disabled={true}
                        />
                    </div>

                    <button
                        className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 mb-4"
                        onClick={(e) => handleSwap()}
                    >
                        스왑!
                    </button>
                    <div className="mb-4">
                        <p className="text-sm font-bold">
                            Token 1 수량: {token1Balance}
                        </p>
                        <p className="text-sm font-bold">
                            Token 2 수량: {token2Balance}
                        </p>
                        <p className="text-sm font-bold">
                            Token 1 유동성: {" "}
                        </p>
                        <p className="text-sm font-bold">
                            Token 2 유동성: {" "}
                        </p>
                    </div>
                </div>
            ) : (
                <div>지갑을 연결해주세요!</div>
            )}
        </div>
    )
}

export default Swap
