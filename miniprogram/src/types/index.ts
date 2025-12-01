// 文件信息
export interface FileInfo {
    id: string
    name: string
    size: number
    path: string
    sheets?: string[]
    selectedSheet?: string
}

// 文件状态（扩展版，包含Excel数据）
export interface FileState extends FileInfo {
    sheets: string[]
    selectedSheet: string
    data: SheetData | null
    color: string
}

// Excel Sheet 数据
export interface SheetData {
    headers: string[]
    rows: Record<string, any>[]
}

// 列映射
export interface ColumnMapping {
    targetField: string // 统一字段名
    sourceFields: Record<string, string> // fileId -> 源列名
}

// 对比组
export interface ComparisonGroup {
    id: string
    name: string
    selectedFileIds: string[]
    mappings: ColumnMapping[]
    keyFields: string[] // 唯一匹配键
    diffFields: string[] // 需要对比的字段
    results: DiffResult[]
    status: 'pending' | 'processing' | 'done'
}

// 对比结果
export interface DiffResult {
    key: string // 由匹配键组成的唯一标识
    status: 'match' | 'mismatch' | 'missing'
    rows: Record<string, any> // fileId -> row data
    diffs: Record<string, boolean> // field -> hasDiff
}

// 小程序特定：文件临时路径信息
export interface TempFileInfo {
    path: string
    size: number
    time: number
    name: string
    type: string
}
