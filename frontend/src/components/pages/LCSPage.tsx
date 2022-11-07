import Separator from "../util/Separator"
import getCache from "../../util/cache"
import LCS from "../../types/LCS"
import { getAPI, getAxios } from "../../util/axios"
import { useEffect, useState } from "react"
import Spacer from "../util/Spacer"
import LCSDisplay from "../misc/LCSDisplay"
import LCSClean from "../../types/LCSClean"
import State from "../../types/State"

type LCSVar = LCSClean | null | undefined
type MeaningsVar = (object | undefined)[]

function LCSPage() {
    const lcsCache = getCache(async (lcsNum: number) => {
        const resp = await getAPI(`lcs/lcs/${lcsNum}`)
        if (resp === undefined || resp === null) {
            return undefined
        }
        return new LCSClean(resp.data as LCS)
    })

    const [lcs, setLcs]: State<LCSVar> = useState<LCSVar>(null)
    const [meanings, setMeanings]: State<MeaningsVar> = useState<MeaningsVar>([
        undefined,
        undefined,
        undefined,
        undefined,
    ])

    const dictionaryFetcher = getAxios(
        "https://api.dictionaryapi.dev/api/v2/entries/en/"
    )

    useEffect(() => {
        async function getLatestLCS(): Promise<void> {
            const resp = await getAPI("lcs/lcs")
            if (resp === undefined) {
                setLcs(undefined)
                setMeanings([undefined, undefined, undefined, undefined])
                return undefined
            } else if (resp === null) {
                return undefined
            }
            const lcs = new LCSClean(resp.data as LCS)
            lcsCache.set(lcs.id, lcs)
            setLcs(lcs)
            setMeanings([undefined, undefined, undefined, undefined])
        }

        getLatestLCS().then()
    }, [])

    useEffect(() => {
        async function getMeanings(): Promise<void> {
            if (!lcs) return

            const mapping: Promise<object>[] = lcs.words.map(
                async (word: string) => {
                    return await dictionaryFetcher.get(word)
                }
            )

            const meanings = await Promise.all(mapping)

            setMeanings(meanings)
        }

        getMeanings().then()
    }, [lcs])

    const failed = (
        <>
            <p className="text-xl italic">No data :(</p>
        </>
    )
    const page = (
        <>
            <p className="text-4xl font-bold">Daily LCS #{lcs?.id}</p>
            <p className="text-l italic">{lcs?.day}</p>
            <Spacer h={2} />
            <Separator />
            <Spacer h={5} />
            <LCSDisplay
                isSus={false}
                lcs={lcs as LCSClean}
                meanings={meanings}
            />
        </>
    ) // Note: 'lcs' should never be null/undef but typescript does not recognise that

    return (
        <div className="flex flex-col items-center">
            {lcs !== null && (lcs === undefined ? failed : page)}
        </div>
    )
}

export default LCSPage
