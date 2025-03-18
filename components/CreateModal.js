const { useState } = require("react")

const CreateModal = ({ isOpen, onClose, onConfirm }) => {
    const [token1, setToken1] = useState("")
    const [token2, setToken2] = useState("")
    const [token1Name, setToken1Name] = useState("")
    const [token2Name, setToken2Name] = useState("")

    return (
        <div className={`fixed inset-0 ${isOpen ? "visible" : "invisible"}`}>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white p-6 rounded-md shadow-md">
                    <h2 className="text-xl font-bold mb-4">유동성 풀 생성</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Token 1 Address:
                        </label>
                        <input
                            type="text"
                            value={token1}
                            onChange={(e) => {
                                setToken1(e.target.value)
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Token 2 Address:
                        </label>
                        <input
                            type="text"
                            value={token2}
                            onChange={(e) => {
                                setToken2(e.target.value)
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Token 1 Name:
                        </label>
                        <input
                            type="text"
                            value={token1Name}
                            onChange={(e) => {
                                setToken1Name(e.target.value)
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Token 2 Name:
                        </label>
                        <input
                            type="text"
                            value={token2Name}
                            onChange={(e) => {
                                setToken2Name(e.target.value)
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <button
                        className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 mr-2"
                        onClick={(e) => {
                            onConfirm(token1, token2, token1Name, token2Name)
                        }}
                    >
                        확인
                    </button>
                    <button
                        className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 mr-2"
                        onClick={(e) => {
                            onClose()
                        }}
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreateModal
