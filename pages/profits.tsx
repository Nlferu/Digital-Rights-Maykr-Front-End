import React, { useState, useRef } from "react"
import { useNotification } from "web3uikit"
import { BigNumber, ethers } from "ethers"
import { Button } from "@/components/button"
import { useSectionInView } from "@/lib/hooks"
import { useAddress, useContract, useConnectionStatus, useContractRead, useContractWrite } from "@thirdweb-dev/react"
import maykr from "@/contracts/DigitalRightsMaykr.json"
import verse from "@/contracts/Verse.json"

export default function Profits() {
    const { ref } = useSectionInView("Profits", 0.5)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isLoadingB, setIsLoadingB] = useState<boolean>(false)
    const dispatch = useNotification()

    const stake = useRef<HTMLInputElement | null>(null)

    const contractAddress = maykr.address
    const abi = maykr.abi

    const verseContractAddress = verse.address
    const verseAbi = verse.abi

    const { contract: maykrContract } = useContract(contractAddress, abi)
    const { contract: verseContract } = useContract(verseContractAddress, verseAbi)
    const account = useAddress()
    const connectionStatus = useConnectionStatus()
    const handleGetProceeds = useContractRead(maykrContract, "getProceeds", [account])
    const handleWithdrawal = useContractWrite(maykrContract, "withdrawProceeds")
    const handleVerseStakeTx = useContractWrite(verseContract, "verseStaking")

    const handleWithdraw = async () => {
        if (connectionStatus === "connected") {
            if (parseFloat(ethers.utils.formatEther(handleGetProceeds.data as BigNumber)) !== 0) {
                setIsLoading(true)

                try {
                    await handleWithdrawal.mutateAsync({ args: [] })
                    handleWithdrawSuccess()
                } catch (error) {
                    console.error(`Withdrawing Proceeds Failed With Error: ${error}`)
                    handleWithdrawError("Withdraw Error")
                } finally {
                    setIsLoading(false)
                }
            } else {
                handleWithdrawError("Nothing To Withdraw")
            }
        } else {
            handleWithdrawError("Wallet Not Connected")
        }
    }

    async function handleWithdrawSuccess() {
        dispatch({
            type: "success",
            message: "Proceeds Withdrew",
            title: "Proceeds Withdrawal Success!",
            position: "bottomR",
            icon: "bell",
        })
    }

    async function handleWithdrawError(error: string) {
        dispatch({
            type: "error",
            message: error,
            title: "Proceeds Withdrawal",
            position: "bottomR",
            icon: "exclamation",
        })
    }

    const handleVerseStake = async () => {
        if (connectionStatus === "connected") {
            const amountString = stake.current?.value
            const amount = parseFloat(amountString || "")

            if (typeof amount === "number" && amount > 0) {
                setIsLoadingB(true)

                try {
                    await handleWithdrawal.mutateAsync({ args: [] })
                    handleWithdrawSuccess()

                    /** @DISCLAIMER */
                    /* As Verse does not support testnets like Sepolia or Goerli below code should be taken just as an example !!! */

                    await handleVerseStakeTx.mutateAsync({ args: [], overrides: { value: amount } })
                    handleVerseStakeSuccess()
                } catch (error) {
                    console.error(`Error occurred: ${error}`)
                    if (error instanceof Error) {
                        if (error.message.includes("DRM__NothingToWithdraw")) {
                            handleVerseStakeError("Nothing To Withdraw")
                        } else if (error.message.includes("verseStaking")) {
                            handleVerseStakeError("Verse Staking Error")
                        } else {
                            handleVerseStakeError(error.message)
                        }
                    }
                } finally {
                    setIsLoadingB(false)
                }
            } else {
                handleVerseStakeError("Please Provide Number Greater Than 0")
            }
        } else {
            handleVerseStakeError("Wallet Not Connected")
        }
    }

    async function handleVerseStakeSuccess() {
        dispatch({
            type: "success",
            message: "Verse Staking Success",
            title: "Staking Success!",
            position: "bottomR",
            icon: "bell",
        })
    }

    async function handleVerseStakeError(error: string) {
        dispatch({
            type: "error",
            message: error,
            title: "Staking Failure!",
            position: "bottomR",
            icon: "exclamation",
        })
    }

    return (
        <div ref={ref}>
            <div className="text-center flex-wrap">
                <div className="flex mt-[7rem] justify-center px-4">
                    <h4 className="bg-gradient-to-r from-pink-600 via-purple-600 to-red-600 inline-block h-[5rem] text-transparent bg-clip-text text-2xl sm:text-4xl font-bold drop-shadow-shady">
                        Your Current Proceeds
                    </h4>
                </div>
                <div className="flex flex-col text-center justify-center items-center">
                    <div className="flex flex-col gap-3 w-[16rem] self-center">
                        <div className="font-bold text-red-600 text-3xl">
                            {handleGetProceeds.data ? (
                                <div className="drop-shadow-shady">
                                    <span className="text-white">{parseFloat(ethers.utils.formatEther(handleGetProceeds.data as BigNumber))}</span> ETH{" "}
                                </div>
                            ) : (
                                <div className="text-2xl drop-shadow-shady">Wallet Not Connected</div>
                            )}
                        </div>

                        <Button name="Withdraw" onClick={handleWithdraw} disabled={isLoading} />
                    </div>
                    <div className="flex mt-[4rem] justify-center px-20 lg:px-1 mb-[1.5rem] lg:mb-0">
                        <h4 className="bg-gradient-to-r from-pink-600 via-purple-600 to-red-600 inline-block h-[6rem] sm:h-[5rem] text-transparent bg-clip-text text-2xl sm:text-4xl font-bold drop-shadow-shady">
                            Stake Your Proceeds With Verse
                        </h4>
                    </div>
                    <div className="flex flex-col gap-3 w-[16rem] self-center">
                        <input
                            type="text"
                            className="p-[0.7rem] border-0 rounded-xl bg-impale hover:bg-hpale shadow-dark text-center text-gray-300 focus:text-gray-300 placeholder:text-gray-100"
                            id="stake"
                            name="stake"
                            ref={stake}
                            placeholder="Stake Amount (ETH)"
                        />

                        <Button name="Verse Stake" onClick={handleVerseStake} disabled={isLoadingB} />
                    </div>
                    <div className="max-w-[40rem] mt-[2rem] text-gray-400 text-xs mb-[4rem] px-4 lg:px-1">
                        Rewards for staking are paid in Verse. Above function allows you to deposit your proceeds into Verse, which will give you some Liquidity
                        Pools (LP) tokens with some APY profit %. If you would like to go further you can deposit your generated LP tokens into Verse Farms for
                        even more profits! You can find more details here: <br></br>
                        <a href="https://verse.bitcoin.com/" target="_blank" rel="noopener noreferrer">
                            Verse
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
