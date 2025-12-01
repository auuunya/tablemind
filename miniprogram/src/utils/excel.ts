import ExcelJS from 'exceljs'
import Taro from '@tarojs/taro'
import { SheetData } from '../types'

/**
 * 读取Excel文件
 * @param filePath 小程序临时文件路径
 * @returns Workbook 和 工作表列表
 */
export async function readExcelFile(filePath: string) {
    try {
        console.log('开始读取文件:', filePath)
        // 读取文件为 ArrayBuffer
        const fs = Taro.getFileSystemManager()
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            fs.readFile({
                filePath,
                success: (res) => {
                    console.log('文件读取成功, 类型:', Object.prototype.toString.call(res.data))
                    resolve(res.data as ArrayBuffer)
                },
                fail: (err) => {
                    console.error('文件读取回调失败:', err)
                    reject(err)
                }
            })
        })

        console.log('文件大小:', arrayBuffer.byteLength)

        // 使用 ExcelJS 解析
        const workbook = new ExcelJS.Workbook()

        // 尝试将 ArrayBuffer 转换为 Uint8Array，这通常在非 Node 环境下更稳定
        const buffer = new Uint8Array(arrayBuffer)
        console.log('转换为 Uint8Array 成功')

        // @ts-ignore
        await workbook.xlsx.load(buffer)
        console.log('Excel 解析成功')

        // 获取所有工作表名称
        const sheets: string[] = []
        workbook.eachSheet((worksheet) => {
            sheets.push(worksheet.name)
        })

        return { workbook, sheets }
    } catch (error) {
        console.error('读取Excel文件失败详情:', error)
        // 抛出更具体的错误信息
        throw new Error(`文件读取失败: ${error.message || error}`)
    }
}

/**
 * 获取工作表数据
 * @param workbook ExcelJS Workbook
 * @param sheetName 工作表名称
 * @returns 表头和数据行
 */
export function getSheetData(
    workbook: ExcelJS.Workbook,
    sheetName: string
): SheetData {
    const worksheet = workbook.getWorksheet(sheetName)
    if (!worksheet) {
        throw new Error(`工作表 "${sheetName}" 不存在`)
    }

    const headers: string[] = []
    const rows: Record<string, any>[] = []

    // 读取表头（第一行）
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell, colNumber) => {
        headers.push(String(cell.value || `Column${colNumber}`))
    })

    // 读取数据行
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // 跳过表头

        const rowData: Record<string, any> = {}
        row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1]
            let cellValue = cell.value

            // 处理特殊类型的单元格值
            if (cellValue && typeof cellValue === 'object') {
                // 处理富文本 (Rich Text)
                if ('richText' in cellValue) {
                    cellValue = (cellValue as any).richText.map((t: any) => t.text).join('')
                }
                // 处理公式结果 (Formula)
                else if ('result' in cellValue) {
                    cellValue = (cellValue as any).result
                }
                // 处理超链接 (Hyperlink)
                else if ('text' in cellValue) {
                    cellValue = (cellValue as any).text
                }
                // 其他对象类型，尝试转为 JSON 字符串或 toString
                else {
                    try {
                        cellValue = JSON.stringify(cellValue)
                    } catch (e) {
                        cellValue = String(cellValue)
                    }
                }
            }

            rowData[header] = cellValue
        })

        // 检查是否为空行
        const hasData = Object.values(rowData).some(val => val !== null && val !== undefined && val !== '')
        if (hasData) {
            rows.push(rowData)
        }
    })

    return { headers, rows }
}

/**
 * 生成对比结果
 * 这个函数与 Web 版本完全相同，可以直接复用
 */
export function generateDiff(
    files: any[],
    mappings: any[],
    keyFields: string[],
    diffFields: string[]
): any[] {
    // 此处复制 Web 版本的 generateDiff 逻辑
    // 为了简化，这里提供简化版本

    if (files.length === 0 || mappings.length === 0 || keyFields.length === 0) {
        return []
    }

    const results: any[] = []
    const allKeys = new Set<string>()

    // 收集所有唯一键
    files.forEach(file => {
        if (!file.data) return
        file.data.rows.forEach((row: any) => {
            const keyParts = keyFields.map(field => {
                const mapping = mappings.find(m => m.targetField === field)
                if (!mapping) return ''
                const sourceField = mapping.sourceFields[file.id]
                return String(row[sourceField] || '')
            })
            const key = keyParts.join('|||')
            if (key) allKeys.add(key)
        })
    })

    // 对每个唯一键进行对比
    allKeys.forEach(key => {
        const result: any = {
            key,
            status: 'match',
            rows: {},
            diffs: {}
        }

        // 查找每个文件中对应的行
        files.forEach(file => {
            if (!file.data) return

            const row = file.data.rows.find((r: any) => {
                const rowKeyParts = keyFields.map(field => {
                    const mapping = mappings.find(m => m.targetField === field)
                    if (!mapping) return ''
                    const sourceField = mapping.sourceFields[file.id]
                    return String(r[sourceField] || '')
                })
                return rowKeyParts.join('|||') === key
            })

            if (row) {
                result.rows[file.id] = row
            }
        })

        // 检查是否所有文件都有这一行
        const fileCount = files.length
        const rowCount = Object.keys(result.rows).length

        if (rowCount < fileCount) {
            result.status = 'missing'
        } else {
            // 对比差异字段
            diffFields.forEach(field => {
                const mapping = mappings.find(m => m.targetField === field)
                if (!mapping) return

                const values = new Set()
                files.forEach(file => {
                    const row = result.rows[file.id]
                    if (row) {
                        const sourceField = mapping.sourceFields[file.id]
                        values.add(String(row[sourceField] || ''))
                    }
                })

                if (values.size > 1) {
                    result.diffs[field] = true
                    result.status = 'mismatch'
                }
            })
        }

        results.push(result)
    })

    return results
}

export function formatExcelCell(cell: any) {
    console.log("cell: ", cell)
    if (cell == null) return "-";

    // 1. 原始类型
    if (typeof cell === "string" || typeof cell === "number" || typeof cell === "boolean")
        return String(cell);

    // 2. 日期类型
    if (cell instanceof Date) {
        return cell.toLocaleDateString(); // 需要精确格式可以改
    }

    // 3. ExcelJS 富文本 { richText: [{ text: 'A' }, { text: 'B' }] }
    if (cell.richText) {
        try {
            return cell.richText.map((r: any) => r.text).join("");
        } catch {
            return JSON.stringify(cell);
        }
    }

    // 4. ExcelJS 公式 { formula: 'A1+B1', result: 10 }
    if (cell.formula) {
        // 显示公式计算结果优先
        if (cell.result != null) return String(cell.result);
        return `=${cell.formula}`;
    }

    // 5. ExcelJS Hyperlink
    if (cell.text && cell.hyperlink) {
        return `${cell.text} (${cell.hyperlink})`;
    }

    // 6. ExcelJS 错误 { error: '#DIV/0!' }
    if (cell.error) {
        return cell.error;
    }

    // 7. 数组（通常出现在共享公式）
    if (Array.isArray(cell)) {
        return cell.map(formatExcelCell).join(", ");
    }

    // 8. 兜底：对象结构
    try {
        return JSON.stringify(cell);
    } catch {
        return String(cell);
    }
}
