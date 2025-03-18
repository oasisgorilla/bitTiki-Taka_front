import { useRouter } from "next/router"

export default function Home() {
    const router = useRouter()
    return (
        <>
            <main className="w-screen flex justify-center items-center">
                <div className="py-8 mx-32">
                    <h1 className="text-white text-3xl font-bold">
                        Tiki-Taka!
                    </h1>
                    <h3 className="text-white text-xl font-bold pt-12">
                        BitTiki-Taka는 Web3생태계에서 가상자산의 재분배를 돕고,
                        그 과정에서 새로운 가치를 창출합니다.
                        <br />
                        가상자산이 오고 갔을 뿐인데 더 큰 가치가 생기는 것이
                        마치 Tiki-Taka와 같지 않나요?
                        <br />
                        BitTiki-Taka를 통해 생태계에 기여하고, 새로운 부를
                        창출하세요! 지금은 yield farming과 swap만 제공하지만
                        <br />
                        추후 flash swap, DEX aggregator, 레버리지 거래가 추가될
                        계획입니다.
                    </h3>
                    <div>
                        <button
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded px-8 py-2"
                            onClick={async function () {
                                router.push("/swap")
                            }}
                        >
                            Swap
                        </button>
                        <button
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded px-8 py-2 ml-8"
                            onClick={async function () {
                                router.push("/pools")
                            }}
                        >
                            get LP
                        </button>
                    </div>
                </div>
            </main>
        </>
    )
}
