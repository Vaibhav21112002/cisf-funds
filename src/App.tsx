import { useState, useEffect } from "react";
import { Button, Dropdown } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { data, reciverAddressList, senderAddressList, headCode, fileNoList } from "./const";
import { ToWords } from 'to-words';
import fmt from 'indian-number-format';
import * as XLSX from "xlsx";
import "./print.css"

type reportInterface = {
	file: string;
	subject: string;
	address: string[];
	data: any;
	signName: string;
	signDesignation: string;
	firstPara: string;
};

const getIndianCurrency = (amount: number) => {
	return fmt.format(amount, { style: "currency", currency: "INR" });
}

const getIndexOfListFromValue = (value: string[]) => {
	return reciverAddressList.findIndex((item: any) => item.value === value);
}

const getWordsFromNumber = (number: number) => {
	const toWords = new ToWords({
		localeCode: 'en-IN',
		converterOptions: {
			currency: true,
			ignoreDecimal: false,
			ignoreZeroCurrency: false,
			doNotAddOnly: true,
			currencyOptions: {
				name: 'Rupee',
				plural: '',
				symbol: '₹',
				fractionalUnit: {
					name: 'Paisa',
					plural: 'Paise',
					symbol: '',
				},
			},
		},
	});
	return toWords.convert(number);
}

const App: React.FC = () => {
	const [headers, setHeaders] = useState<string[]>([]);
	const [tableData, setTableData] = useState<any[]>([]);
	const [edit, setEdit] = useState<boolean>(false);
	const [changed, setChanged] = useState<boolean>(false);
	const [pratilip, setPratilip] = useState<any>([]);
	const [report, setReport] = useState<reportInterface>({
		file: fileNoList[0],
		subject: `वर्ष ${" "} ${new Date().getFullYear()} - ${new Date().getFullYear() + 1} ${" "} के लिए अतिरिक्त राशि का आबंटन ।`,
		address: reciverAddressList[0].value,
		data: data,
		signName: "पवन कौशिक",
		signDesignation: "लेखा अधिकारी/बजट",
		firstPara: "मैं एतदद्वारा वित्त वर्ष 2024 - 2025 के लिए अनुदान संख्या 51 ‐ पुलिस, मुख्य शीर्ष 2055 लघु शीर्ष 00.107 औ.सु.ब., स्वीकतृ के अन्तर्गत उल्लेखित संबंधित डी.डी.ओ. को उनके नाम के सामने लिखे भिन्न‐2 विषय शीर्ष/शीर्षो में ",

	});

	const handlePrint = async() => {
		setTimeout(() => {
			window.alert("Please wait for the PDF to load");
			window.print();
		}, 2000);
		

	}

	const handleExportToWordFile = () => {
		const html = document.getElementById("printableDiv")?.innerHTML;
		const blob = new Blob([html], { type: "application/msword" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "Funds Allocation.doc";
		a.click();
	}

	const inputClass: string =
		" -gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:-transparent";

	const handleFileChange = (e: any) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			const data = new Uint8Array(e.target?.result as ArrayBuffer);
			const workbook = XLSX.read(data, { type: "array" });
			const sheetName = workbook.SheetNames[0];
			const sheet = workbook.Sheets[sheetName];
			const sheetData: string[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
			let tempData: any = {};
			for (let i = 0; i < sheetData[0].length; i++) {
				let temp: any[] = []
				sheetData.forEach((item: any) => {
					if (item[i] !== undefined && item[i] !== sheetData[0][i]) temp.push(item[i]);
				});
				tempData[sheetData[0][i]] = temp;
			}

			const tempHeads = tempData["HEAD"];
			let heads: any = [];
			tempHeads.forEach((item: any) => {
				if (!heads.includes(item)) heads.push(item);
			}
			);

			let uniqueDDO = [];
			tempData["DDO"].forEach((item: any) => {
				if (!uniqueDDO.includes(item)) uniqueDDO.push(item);
			});

			let headValues = {};
			for (let i = 0; i < heads.length; i++) {
				headValues[heads[i]] = Array(uniqueDDO.length).fill(0);
			}

			for (let i = 0; i < tempHeads.length; i++) {
				headValues[tempHeads[i]][uniqueDDO.indexOf(tempData["DDO"][i])] = tempData["DEMAND"][i];
			}




			let tempReportData = report.data;
			for (let i = 0; i < tempReportData.length; i++) {
				if (tempReportData[i].key === "Name of DDOs") tempReportData[i].value = uniqueDDO;
			}

			let headTempData = []
			for (let i = 0; i < Object.keys(headValues).length; i++) {
				headTempData.push({
					key: Object.keys(headValues)[i] + "\n" + headCode[Object.keys(headValues)[i]],
					value: Object.values(headValues)[i]
				})
			}

			const headCodeKeys = Object.keys(headCode);
			headTempData.sort((a: any, b: any) => {
				return headCodeKeys.indexOf(a.key.split("\n")[0]) - headCodeKeys.indexOf(b.key.split("\n")[0]);
			});


			tempReportData = [...tempReportData, ...headTempData];




			setReport({
				...report,
				data: tempReportData
			});
			setChanged(!changed);

			setPratilip([]);
			setPratilip([
				{
					name: "All Concerned IsG",
					info: "For information w.r.t. your ltr/msg no ( ) dated 00.00.2024"
				},
				{
					name: "All Concerned IsG",
					info: "For information w.r.t. your ltr/msg no ( ) dated 00.00.2024"
				}
			])

			for (let i = 0; i < uniqueDDO.length; i++) {
				setPratilip((prev: any) => {
					let temp = [...prev];
					temp.push({
						name: uniqueDDO[i],
						info: "For information w.r.t. your ltr/msg no ( ) dated 00.00.2024"
					});
					return temp;
				}
				);
			}

		};
		reader.readAsArrayBuffer(file);
	}

	useEffect(() => {
		const headers = report.data.map((item: any) => item.key);
		let tableData: any[] = [];
		for (let i = 0; i < report.data[0].value.length; i++) {
			let temp: any[] = [];
			report.data.forEach((item: any) => {
				temp.push(item.value[i]);
			})
			tableData.push(temp);
		}
		setHeaders(headers);
		setTableData(tableData);
	}, [changed])

	return (
		<div className="w-full min-h-[100vh] flex justify-center bg-[#3A3E41]">
			<div
				className="w-[55rem] py-16 px-12 flex flex-col gap-4 bg-white printableDiv"
				id="printableDiv"
			>
				<div className="w-full flex flex-col justify-center items-center gap-1">
					<h1>महानिदेशालय</h1>
					<h1>केंद्रीय औद्योगिक सुरक्षा बल</h1>
					<h1>गृह मंत्रालय</h1>
				</div>
				<div className="flex justify-between items-end">
					<div>
						{edit ? (
							<textarea
								className={inputClass}
								value={report.file}
								onChange={(e) =>
									setReport({
										...report,
										file: e.target.value,
									})
								}
							/>
						) : (
							report.file
						)}
					</div>
					<div className="flex flex-col items-end">
						{senderAddressList.map((line, index) => (
							<h1 key={index}>{line}</h1>
						))}
						<div className="flex  gap-8">
							<h1>दिनांक </h1>
							<h1>
								/{new Date().getMonth() + 1}/
								{new Date().getFullYear()}
							</h1>
						</div>

					</div>
				</div>
				<div>
					<h1> सेवा में, </h1>
					<div className="px-20 flex flex-col gap-2">
						{edit ? (
							<Dropdown
								menu={{
									items: reciverAddressList,
									onClick: (e: any) => {
										console.log(e.item.props.value)
										setReport({
											...report,
											address: e.item.props.value,
											file: fileNoList[getIndexOfListFromValue(e.item.props.value)]
										})
									}
								}}
							>
								<h1>
									{report.address.map((line, index) => (
										<h1 key={index}>{line}</h1>
									))}
								</h1>
							</Dropdown>
						) : (
							report.address.map((line, index) => (
								<h1 key={index}>{line}</h1>
							))
						)}
						<br />
						<h1 className="flex w-full items-center font-semibold">
							विषय :‐{" "}
							<span className="underline">
								{edit ? (
									<textarea
										className={inputClass + " "}
										value={report.subject}
										onChange={(e) =>
											setReport({
												...report,
												subject: e.target.value,
											})
										}
									/>
								) : (
									report.subject
								)}
							</span>
						</h1>
					</div>
				</div>
				<div>
					<h1>महोदय,</h1>
					<h1 className="indent-20 mt-4 text-justify">
						{edit ? (
							<textarea
								className={inputClass}
								value={report.firstPara}
								onChange={(e) =>
									setReport({
										...report,
										firstPara: e.target.value,
									})
								}
							/>
						) : (
							report.firstPara
						)}
						<span className="font-semibold text-lg">
							{
								getIndianCurrency(
									tableData?.reduce(
										(acc: number, curr: any) =>
											acc +
											curr?.slice(1)?.reduce(
												(acc: number, curr: number) =>
													acc + curr,
												0
											),
										0
									)
								)
							}

							/- (Rupees {" "}
							{getWordsFromNumber(
								tableData?.reduce(
									(acc: number, curr: any) =>
										acc +
										curr?.slice(1)?.reduce(
											(acc: number, curr: number) =>
												acc + curr,
											0
										),
									0
								)
							)}
							)</span> मात्र का
						आबंटन करता हूँ।
					</h1>
				</div>
				<div className="mt-12">
					{false && <div className="flex gap-2 my-2">
						<Button className="bg-blue-700 text-white"
							onClick={() => {
								let tempReportData = report.data;
								for (let i = 0; i < tempReportData.length; i++) {
									tempReportData[i].value.push(0);
								}
								setReport({
									...report,
									data: tempReportData
								});
								setChanged(!changed);

							}}
						>
							<h1>Add Row</h1>
						</Button>
						<Button className="bg-blue-700 text-white"
							onClick={() => {
								let tempValue: any = [];
								tableData.forEach(() => {
									tempValue.push(0)
								});
								setReport({
									...report,
									data: [
										...report.data,
										{
											key: "New Column",
											value: tempValue
										},
									],
								});
								setChanged(!changed);

							}}
						><h1>Add Column</h1></Button>
					</div>}
					<div className="w-full flex justify-center px-10">
						<table className="table-auto">
							<thead className="ddoData">
								<tr>
									<th className="">S.No</th>
									{headers.map((header, index) => (
										<th key={index} className="">
											{edit ? (
												<textarea
													className={inputClass}
													value={headers[index]}
													onChange={(e) => {
														setHeaders((prev) => {
															let temp = [...prev];
															temp[index] = e.target.value;
															return temp;
														}
														);
													}}
												/>
											) : (
												header === "Name of DDOs" ?
													<h1>{header}</h1> :
													<div>
														<h1>{header.split("\n")[0]}</h1>
														<div>{headCode[header.split("\n")[0]]}</div>
													</div>

											)}
										</th>
									))}
									{<th className="">Total</th>}
									{edit && <th className="">Add</th>}
									{edit && <th className="">Delete</th>}
								</tr>
							</thead>
							<tbody className="ddoData">
								{tableData.map((row, indexp) => (
									<tr key={indexp}>
										<td className="">{indexp + 1}</td>
										<td className=""> {
											edit ? (
												<textarea
													className={inputClass}
													value={tableData[indexp][0]}
													onChange={(e) => {
														setTableData((prev) => {
															let temp = [...prev];
															temp[indexp][0] = e.target.value;
															return temp;
														});
													}}
												/>
											) : <h1 className="text-left px-1">{row[0]}</h1>
										} </td>
										{row.map((cell: any, index: number) => {
											if (index === 0) return;
											return (
												<td key={index} className="">
													{edit ? (
														<textarea
															className={inputClass}
															value={tableData[indexp][index]}
															onChange={(e) => {
																setTableData((prev) => {
																	let temp = [...prev];
																	temp[indexp][index] =
																		parseInt(e.target.value) || 0;
																	return temp;
																});
															}}
														/>
													) : (
														<h1 className="text-right px-1">{getIndianCurrency(cell)}</h1>
													)}
												</td>
											)
										})}
										{<td className="font-bold">
											<h1 className="text-right px-1">
												{
													getIndianCurrency(row?.slice(1)?.reduce(
														(acc: number, curr: number) =>
															acc + curr,
														0
													))
												}
											</h1>
										</td>}
										{edit &&
											<td className="font-bold">
												<PlusOutlined
													className="cursor-pointer hover:text-green-500"
													onClick={() => {
														setPratilip((prev: any) => {
															let temp = [...prev];
															temp.push({
																name: row[0],
																info: "For information w.r.t. your ltr/msg no ( ) dated 00.00.2024"
															});
															return temp;
														})
													}}
												/>
											</td>
										}
										{
											edit &&
											<td className=" font-bold">
												<DeleteOutlined
													className="cursor-pointer hover:text-red-500"
													onClick={() => {
														let tempData = report.data;
														for (let i = 0; i < tempData.length; i++) {
															tempData[i].value = tempData[i].value.filter((item: any, index: number) => index !== indexp);
														}
														setReport({
															...report,
															data: tempData
														});
														setChanged(!changed);
													}}
												/>
											</td>
										}

									</tr>
								))}
								<tr>
									<td className=""> </td>
									<td className="font-bold">Total</td>
									{tableData[0]?.slice(1)?.map((_, index) => (
										<td className="font-bold">
											<h1 className="text-right px-1">
												{
													getIndianCurrency(tableData?.reduce(
														(acc: number, curr: any) =>
															acc + curr[index + 1],
														0
													))
												}
											</h1>
										</td>
									))}
									<td className="font-bold">
										<h1 className="text-right px-1">
											{
												getIndianCurrency(tableData?.reduce(
													(acc: number, curr: any) =>
														acc +
														curr?.slice(1)?.reduce(
															(acc: number, curr: number) =>
																acc + curr,
															0
														),
													0
												))
											}
										</h1>
									</td>
								</tr>
							</tbody>
						</table>
					</div>

				</div>
				<div>
					<h1 className=" mt-4 flex ">
						2.
						<span className="indent-[3.6rem]">कृपया उपरोक्त राशि का एल.ओ.सी. संबंधित चैक ड्राईंग डी.डी.ओ. के हित में शीघ्र पारित करने की व्यवस्था करें, जहॉं आवश्यक है ।</span>
					</h1>
				</div>
				<div className="w-full justify-end flex mt-12">
					<div className="flex items-center flex-col">
						<h1>भवदीय,</h1>
						<br />
						<br />
						<h1 className="font-bold">(
							{edit ? (
								<textarea
									className={inputClass}
									value={report.signName}
									onChange={(e) =>
										setReport({
											...report,
											signName: e.target.value,
										})
									}
								/>
							) : (
								report.signName
							)}
							)</h1>
						<h1 className="font-bold">
							{edit ? (
								<textarea
									className={inputClass}
									value={report.signDesignation}
									onChange={(e) =>
										setReport({
											...report,
											signDesignation: e.target.value,
										})
									}
								/>
							) : (
								report.signDesignation
							)}
						</h1>
					</div>
				</div>
				<div>
					<div className="w-full flex gap-8 items-center">
						<h1>प्रतिलिपि :‐</h1>
						{edit && <div>
							<button
								className="bg-blue-700 text-white p-2 rounded-md cursor-pointer "
								onClick={() => {
									setPratilip((prev: any) => {
										let temp = [...prev];
										temp.unshift({
											name: "All Concerned IsG",
											info: "For information w.r.t. your ltr/msg no ( ) dated 00.00.2024"
										});
										return temp;
									})
								}}
							>
								<h1>Add Pratilip</h1>
							</button>
						</div>}
					</div>
					<div className="pl-4">
						<table className=" border-none w-full table-auto">
							<tbody>
								{pratilip.map((item: any, index: number) => (
									<tr className="w-full flex gap-4">
										<td className="w-5/12">
											{
												edit ? (
													<textarea
														className={inputClass}
														value={pratilip[index].name}
														onChange={(e) => {
															setPratilip((prev: any) => {
																let temp = [...prev];
																temp[index].name = e.target.value;
																return temp;
															})
														}}
													/>
												) : (
													<textarea
														className="w-full min-h-[10px] flex items-center"
														value={item.name}
														readOnly
														onResize={null}
													></textarea>
												)
											}
										</td>
										<td className="w-7/12 flex justify-start">
											:
											{
												edit ? (
													<textarea
														className={inputClass}
														value={pratilip[index].info}
														onChange={(e) => {
															setPratilip((prev: any) => {
																let temp = [...prev];
																temp[index].info = e.target.value;
																return temp;
															})
														}}
													/>
												) : (
													<textarea
														className="w-full min-h-[10px] flex items-center"
														value={item.info}
														readOnly
														onResize={null}
													></textarea>
												)
											}
										</td>
										{edit && <td>
											<DeleteOutlined
												className="cursor-pointer hover:text-red-500"
												onClick={() => {
													setPratilip((prev: any) => {
														let temp = [...prev];
														temp = temp.filter((item: any, indexp: number) => indexp !== index);
														return temp;
													})
												}}
											/>
										</td>}
									</tr>

								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-4" id = "no-print">
				<Dropdown
					menu={{
						items: [
							{
								key: "Import",
								label: "Import",
								onClick: () => document.getElementById("file")?.click()
							},
							{
								key: "Edit",
								label: edit ? "Save" : "Edit",
								onClick: () => setEdit(!edit)
							},
							{
								key: "Print",
								label: "Export as PDF",
								onClick: handlePrint
							},
							// {
							// 	key: "Export",
							// 	label: "Export as Word",
							// 	onClick: handleExportToWordFile
							// },
							{
								key: "Reset",
								label: "Reset",
								onClick: () => {
									localStorage.clear();
									window.location.reload();
								}
							}
						]
					}}
				>
					<h1 className="bg-blue-700 text-white p-2 rounded-md cursor-pointer">Actions</h1>
				</Dropdown>
				<input
					type="file"
					onChange={handleFileChange}
					name="file"
					id="file"
					className="hidden"
				/>

			</div>
		</div>
	);
};

export default App;
