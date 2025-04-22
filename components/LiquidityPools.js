import { useState, useEffect } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import {
    bttAddresses,
    bttDexAbi,
    bttPool,
    bttPoolToken,
} from "@/constants/btt-dex-constant"
import CreateModal from "@/components/CreateModal"

const LiquidityPools = () => {
    const { chainId: chainIdHex, isWeb3Enabled, account } = useMoralis()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [pools, setPools] = useState([])
    const [selectedPool, setSelectedPool] = useState("")
    const [liquidityAmountToken1, setLiquidityAmountToken1] = useState("0")
    const [liquidityAmountToken2, setLiquidityAmountToken2] = useState("0")
    const [liquidityAmount, setLiquidityAmount] = useState("0")
    const chainId = parseInt(chainIdHex)
    const bttContractAddress =
        chainId in bttAddresses ? bttAddresses[chainId].bttSwap : null

    const { runContractFunction: createLiquidityPool } = useWeb3Contract({
        abi: bttDexAbi,
        contractAddress: bttContractAddress,
        functionName: "createPairs",
    })

    const { runContractFunction: getPairs } = useWeb3Contract({
        abi: bttDexAbi,
        contractAddress: bttContractAddress,
        functionName: "getPairs",
    })

    const { runContractFunction: addLiquidity } = useWeb3Contract({
        abi: bttPool,
        functionName: "addLiquidity",
    })

    const { runContractFunction: getLiquidityToken } = useWeb3Contract({
        abi: bttPool,
        functionName: "liquidityToken",
    })

    const { runContractFunction: getToken1 } = useWeb3Contract({
        abi: bttPool,
        functionName: "token1",
    })

    const { runContractFunction: getToken2 } = useWeb3Contract({
        abi: bttPool,
        functionName: "token2",
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

    useEffect(()=> {
        if(selectedPool){
            const fetchLiquidityAmount = async () => {
                const liquidityToken = await getLiquidityToken()
                if(liquidityToken){
                    const balance = await getBalanceOf({
                        params:{
                            contractAddress:liquidityToken,
                            params:{
                                account:account
                            },
                        },
                    })
                    setLiquidityAmount(balance)
                }
            }
        }
    })

    const handleConfirmModal = async (
        token1,
        token2,
        token1Name,
        token2Name
    ) => {
        try {
            console.log("Create Liquidity pool for ", token1, token2)
            await createLiquidityPool({
                params: {
                    params: {
                        token1: token1,
                        token2: token2,
                        token1Name: token1Name,
                        token2Name: token2Name,
                    },
                },
                onSuccess: (tx) => {
                    console.log("Liquidity pool created successfully ", tx)
                },
                onError: (err) => {
                    console.log(err)
                },
            })
            setIsModalOpen(false)
        } catch (error) {
            console.log("Error when create liquidity pool: ", error)
        }
    }
    const handleCloseModal = () => {
        setIsModalOpen(false)
    }

    const handleAddLiquidity = async () => {
        try {
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
            const isToken1Approved = await checkAllowance(
                token1Address,
                account,
                selectedPool,
                ethers.utils.parseEther(liquidityAmountToken1)
            )
            const isToken2Approved = await checkAllowance(
                token2Address,
                account,
                selectedPool,
                ethers.utils.parseEther(liquidityAmountToken2)
            )
            if (!isToken1Approved || !isToken2Approved) {
                await requestApprovals(
                    isToken1Approved,
                    token1Address,
                    isToken2Approved,
                    token2Address,
                    selectedPool,
                    ethers.utils.parseEther(liquidityAmountToken1),
                    ethers.utils.parseEther(liquidityAmountToken2)
                )
            } else {
                await triggerLiquidity(
                    ethers.utils.parseEther(liquidityAmountToken1),
                    ethers.utils.parseEther(liquidityAmountToken2)
                )
            }
        } catch (error) {
            console.log(error)
        }
    }

    const checkAllowance = async (tokenAddress, owner, spender, amount) => {
        console.log('1', tokenAddress, '2', owner, '3', spender, '4', amount)
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
        isToken2Approved,
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
            if (isToken2Approved) {
                await approve({
                    params: {
                        contractAddress: token2Address,
                        params: {
                            spender: spender,
                            value: amountToken2,
                        },
                    },
                })
            }
            await triggerLiquidity(amountToken1, amountToken2)
        } catch (error) {
            console.log(error)
        }
    }

    const triggerLiquidity = async (amount1, amount2) => {
        try {
            await addLiquidity({
                params: {
                    contractAddress: selectedPool,
                    params: {
                        amount1: amount1,
                        amount2: amount2,
                    },
                },
            })
            console.log("Add liquidity successfull")
        } catch {
            console.log(error)
        }
    }

    return (
        <div className="mt-8 p-8 bg-white rounded-lg shadow-md max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">LiquidityPools</h2>
            {isWeb3Enabled && bttContractAddress != null ? (
                <div>
                    <p className="mb-4">환영합니다!, {account}!</p>
                    <button
                        className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 mb-4"
                        onClick={(e) => setIsModalOpen(true)}
                    >
                        유동성 풀 생성
                    </button>
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
                        <label className="text-sm font-bold">
                            Token1 Amount:
                        </label>
                        <input
                            type="text"
                            value={liquidityAmountToken1}
                            onChange={(e) => {
                                setLiquidityAmountToken1(e.target.value)
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-sm font-bold">
                            Token2 Amount:
                        </label>
                        <input
                            type="text"
                            value={liquidityAmountToken2}
                            onChange={(e) => {
                                setLiquidityAmountToken2(e.target.value)
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <button
                        className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 mb-4"
                        onClick={(e) => {
                            handleAddLiquidity()
                        }}
                    >
                        유동성 추가
                    </button>
                    <p className="text-sm font-bold">
                        현재 유동성 : {liquidityAmount}
                    </p>
                    <CreateModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onConfirm={handleConfirmModal}
                    />
                </div>
            ) : (
                <div>지갑을 연결해주세요!</div>
            )}
        </div>
    )
}

export default LiquidityPools
