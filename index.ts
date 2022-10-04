import dotenv from "dotenv"
dotenv.config()

import { Parser } from "json2csv"
import { template } from "./template"
import { writeFile, readFile } from "fs/promises"
import { createWriteStream } from "fs"
import { Result, results } from "./results"
import { BlobServiceClient } from "@azure/storage-blob"
import readline from "readline"

async function main() {
	const fields = template.elements.map((element) => element.text)
	const csv = new Parser({ fields })
	const parsedResults = parseResults(results)

	await writeFile("output.csv", csv.parse(parsedResults))

	const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!)
	const containerClient = blobServiceClient.getContainerClient("test")
	await containerClient.createIfNotExists()
	const blockBlobClient = containerClient.getBlockBlobClient("output.csv")
	const blob = await blockBlobClient.download()

	const stream = blob.readableStreamBody!
	const writeStream = createWriteStream("output.csv")

	const rl = readline.createInterface(stream, writeStream)
	rl.on("line", async (line) => {
		const underWatermark = writeStream.write(line + "\n")

		if (!underWatermark) {
			await new Promise((resolve) => {
				writeStream.once("drain", resolve)
			})
		}
	})

	rl.on("close", () => {
		const newLine = '"Mary Doe", "black"'
		writeStream.write(newLine)
		writeStream.close()
	})

	writeStream.once("close", async () => {
		const file = await readFile("output.csv")
		blockBlobClient.uploadFile("output.csv")
		console.log({ file: file.toString() })
	})

	const updatedBlobBlockClient = containerClient.getBlockBlobClient("output.csv")
	const updatedBlob = await updatedBlobBlockClient.download()

	const updatedContent = await new Promise((res, rej) => {
		let data = ""
		updatedBlob.readableStreamBody?.on("data", (chunk) => (data += chunk))
		updatedBlob.readableStreamBody?.on("end", () => res(data))
		updatedBlob.readableStreamBody?.on("error", (error) => rej(error))
	})

	console.log({ updatedContent })
}

function parseResults(results: Result[]) {
	const parsedResults: Record<string, string>[] = []
	for (const result of results) {
		const line: Record<string, string> = {}
		result.forEach((field) => {
			const element = template.elements.find((element) => element.id === field.elementId)
			if (element) line[element.text] = field.value
		})

		if (Object.keys(line).length) parsedResults.push(line)
	}
	return parsedResults
}

main()
