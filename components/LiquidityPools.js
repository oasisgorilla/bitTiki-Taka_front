import { useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { bttAddresses, bttDexAbi } from "@/constants/btt-dex-constant"
import CreateModal from "@/components/CreateModal"

const LiquidityPools = () => {
    const { chainId: chainIdHex, isWeb3Enabled, account } = useMoralis()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const chainId = parseInt(chainIdHex)
    const bttContractAddress =
        chainId in bttAddresses ? bttAddresses[chainId].bttSwap : null

    const { runContractFunction: createLiquidityPool } = useWeb3Contract({
        abi: bttDexAbi,
        contractAddress: bttContractAddress,
        functionName: "createPairs",
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

    return (
        <div className="mt-8 p-8 bg-white rounded-lg shadow-md max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">LiquidityPools</h2>
            {isWeb3Enabled && bttContractAddress != null ? (
                <div>
                    <p className="mb-4">환영합니다!, {account}!</p>
                    <button
                        className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
                        onClick={(e) => setIsModalOpen(true)}
                    >
                        유동성 풀 생성
                    </button>
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
