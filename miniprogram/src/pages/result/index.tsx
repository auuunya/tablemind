import { useState, useEffect } from 'react'
import { View, Button, Text, ScrollView, Radio } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { ComparisonGroup, DiffResult, FileState } from '../../types'
import './index.scss'

export default function Result() {
    const router = useRouter()
    const [groups, setGroups] = useState<ComparisonGroup[]>([])
    const [files, setFiles] = useState<FileState[]>([])
    const [activeTab, setActiveTab] = useState(0)
    const [filter, setFilter] = useState<'all' | 'match' | 'mismatch' | 'missing'>('all')
    const [excludeStatus, setExcludeStatus] = useState(false)
    const [displayLimit, setDisplayLimit] = useState(20)

    useEffect(() => {
        const groupsParam = router.params.groups
        const filesParam = router.params.files

        if (groupsParam) {
            try {
                setGroups(JSON.parse(decodeURIComponent(groupsParam)))
            } catch (error) {
                console.error('解析结果失败:', error)
            }
        }
        if (filesParam) {
            try {
                setFiles(JSON.parse(decodeURIComponent(filesParam)))
            } catch (error) {
                console.error('解析文件失败:', error)
            }
        }
    }, [])

    const currentGroup = groups[activeTab]

    // 过滤结果
    const filteredResults = (currentGroup?.results || []).filter(r => {
        if (filter === 'all') return true
        return r.status === filter
    })

    const stats = {
        total: currentGroup?.results.length || 0,
        match: currentGroup?.results.filter(r => r.status === 'match').length || 0,
        mismatch: currentGroup?.results.filter(r => r.status === 'mismatch').length || 0,
        missing: currentGroup?.results.filter(r => r.status === 'missing').length || 0
    }

    // 获取文件名
    const getFileName = (fileId: string) => {
        return files.find(f => f.id === fileId)?.name || fileId
    }

    // 获取表头列
    const getColumns = () => {
        if (!currentGroup) return []

        const columns = []
        if (!excludeStatus) columns.push('状态')
        columns.push(...currentGroup.keyFields)
        columns.push(...currentGroup.diffFields)

        // 为每个对比字段添加差异详情列
        currentGroup.diffFields.forEach(field => {
            columns.push(`差异详情: ${field}`)
        })

        return columns
    }

    const handleExport = async () => {
        if (!currentGroup) return

        try {
            Taro.showLoading({ title: '正在导出...' })

            // 1. 动态导入 ExcelJS (避免初始包过大)
            // 注意：小程序环境可能需要特殊的 ExcelJS 构建或适配
            // 这里假设 utils/excel.ts 中已经处理了 ExcelJS 的引入和适配
            const ExcelJS = require('exceljs/dist/exceljs.min.js')
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('对比结果')

            // 2. 设置表头
            const columns = getColumns()
            worksheet.columns = columns.map(col => ({
                header: col,
                key: col,
                width: col === '状态' ? 10 : col.startsWith('差异详情') ? 40 : 20
            }))

            // 3. 添加数据行
            filteredResults.forEach(result => {
                const row: any = {}

                // 状态列
                if (!excludeStatus) {
                    row['状态'] = result.status === 'match' ? '匹配' : result.status === 'mismatch' ? '差异' : '缺失'
                }

                // 匹配键
                currentGroup.keyFields.forEach(field => {
                    const val = Object.values(result.rows).find(r => r)?.[field]
                    row[field] = val
                })

                // 对比字段
                currentGroup.diffFields.forEach(field => {
                    const val = Object.values(result.rows).find(r => r)?.[field]
                    row[field] = val
                })

                // 差异详情
                currentGroup.diffFields.forEach(field => {
                    const colName = `差异详情: ${field}`
                    if (result.diffs[field]) {
                        const details = currentGroup.selectedFileIds.map(fileId => {
                            const val = result.rows[fileId]?.[field]
                            return `${getFileName(fileId)}: ${val ?? '(空)'}`
                        }).join('\n') // 使用换行符分隔
                        row[colName] = details
                    } else {
                        row[colName] = ''
                    }
                })

                worksheet.addRow(row)
            })

            // 4. 写入 Buffer
            const buffer = await workbook.xlsx.writeBuffer()

            // 确保转换为 ArrayBuffer
            // ExcelJS 在不同环境下可能返回 Node Buffer 或 Uint8Array
            let data: ArrayBuffer
            if (buffer instanceof ArrayBuffer) {
                data = buffer
            } else if ((buffer as any).buffer instanceof ArrayBuffer) {
                // 如果是 Uint8Array 或 BufferPolyfill，取其底层 ArrayBuffer
                data = (buffer as any).buffer
            } else {
                // 兜底：尝试转换为 Uint8Array 再取 buffer
                data = new Uint8Array(buffer as any).buffer
            }

            // 5. 保存文件
            const fs = Taro.getFileSystemManager()
            const fileName = `对比结果_${currentGroup.name}_${Date.now()}.xlsx`
            const filePath = `${Taro.env.USER_DATA_PATH}/${fileName}`

            fs.writeFile({
                filePath,
                data: data,
                // encoding: 'binary', // 传递 ArrayBuffer 时不需要指定 encoding
                success: () => {
                    Taro.hideLoading()
                    // 6. 打开文件
                    Taro.openDocument({
                        filePath,
                        showMenu: true,
                        fileType: 'xlsx', // 明确指定 xlsx
                        success: () => {
                            Taro.showToast({ title: '导出成功', icon: 'success' })
                        },
                        fail: (err) => {
                            console.error('打开文件失败', err)
                            Taro.showToast({ title: '打开文件失败', icon: 'none' })
                        }
                    })
                },
                fail: (err) => {
                    Taro.hideLoading()
                    console.error('写入文件失败', err)
                    Taro.showToast({ title: '导出失败', icon: 'none' })
                }
            })

        } catch (error) {
            Taro.hideLoading()
            console.error('导出异常', error)
            Taro.showToast({ title: '导出出错', icon: 'none' })
        }
    }

    if (!currentGroup) return <View className='loading'>加载中...</View>

    return (
        <View className='result-page'>
            {/* 顶部组切换 */}
            <ScrollView scrollX className='tabs-scroll'>
                <View className='tabs'>
                    {groups.map((group, index) => (
                        <View
                            key={group.id}
                            className={`tab-item ${activeTab === index ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(index)
                                setDisplayLimit(20)
                                setFilter('all')
                            }}
                        >
                            <Text>{group.name}</Text>
                            <Text className='tab-badge'>{group.results.length}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* 筛选按钮 */}
            <View className='filter-bar'>
                <View
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    全部 ({stats.total})
                </View>
                <View
                    className={`filter-btn match ${filter === 'match' ? 'active' : ''}`}
                    onClick={() => setFilter('match')}
                >
                    匹配 ({stats.match})
                </View>
                <View
                    className={`filter-btn mismatch ${filter === 'mismatch' ? 'active' : ''}`}
                    onClick={() => setFilter('mismatch')}
                >
                    差异 ({stats.mismatch})
                </View>
                <View
                    className={`filter-btn missing ${filter === 'missing' ? 'active' : ''}`}
                    onClick={() => setFilter('missing')}
                >
                    缺失 ({stats.missing})
                </View>
            </View>

            {/* 底部操作栏 */}
            <View className='action-bar fixed-bottom'>
                <View className='action-left'>
                    <Button className='nav-btn secondary' onClick={() => Taro.navigateBack()}>上一步</Button>
                </View>

                <View className='action-right'>
                    <View className='export-option' onClick={() => setExcludeStatus(!excludeStatus)}>
                        <Radio checked={excludeStatus} color='#3b82f6' style={{ transform: 'scale(0.7)' }} />
                        <Text>不含状态列</Text>
                    </View>
                    <Button className='nav-btn primary' onClick={handleExport}>导出结果</Button>
                </View>
            </View>

            {/* 结果表格 */}
            <ScrollView scrollX className='table-container'>
                <View className='table'>
                    {/* 表头 */}
                    <View className='table-header'>
                        {getColumns().map((col, i) => (
                            <View key={i} className={`th ${col === '状态' ? 'status' : col.startsWith('差异详情') ? 'detail' : ''}`}>
                                <Text>{col}</Text>
                            </View>
                        ))}
                    </View>

                    {/* 表格内容 */}
                    {filteredResults.slice(0, displayLimit).map((result, rIndex) => (
                        <View key={rIndex} className={`table-row ${result.status}`}>
                            {!excludeStatus && (
                                <View className='td status'>
                                    <Text className='status-tag'>
                                        {result.status === 'match' ? '匹配' : result.status === 'mismatch' ? '差异' : '缺失'}
                                    </Text>
                                </View>
                            )}

                            {/* 匹配键值 */}
                            {currentGroup.keyFields.map((field, i) => {
                                const val = Object.values(result.rows).find(r => r)?.[field]
                                return (
                                    <View key={`key-${i}`} className='td'>
                                        <Text>{String(val || '-')}</Text>
                                    </View>
                                )
                            })}

                            {/* 对比字段值 */}
                            {currentGroup.diffFields.map((field, i) => {
                                const val = Object.values(result.rows).find(r => r)?.[field]
                                const hasDiff = result.diffs[field]
                                return (
                                    <View key={`diff-${i}`} className={`td ${hasDiff ? 'has-diff' : ''}`}>
                                        <Text>{String(val || '-')}</Text>
                                    </View>
                                )
                            })}

                            {/* 差异详情列 (每个对比字段一列) */}
                            {currentGroup.diffFields.map((field, i) => {
                                const hasDiff = result.diffs[field]
                                return (
                                    <View key={`detail-${i}`} className='td detail'>
                                        {hasDiff ? (
                                            <View className='diff-list'>
                                                {currentGroup.selectedFileIds.map(fileId => {
                                                    const val = result.rows[fileId]?.[field]
                                                    return (
                                                        <View key={fileId} className='diff-item'>
                                                            <Text className='file-name'>{getFileName(fileId)}</Text>
                                                            <Text className='file-val'>{String(val ?? '(空)')}</Text>
                                                        </View>
                                                    )
                                                })}
                                            </View>
                                        ) : (
                                            <Text className='no-diff'>无差异</Text>
                                        )}
                                    </View>
                                )
                            })}
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* 加载更多 */}
            {filteredResults.length > displayLimit && (
                <View className='load-more'>
                    <Button onClick={() => setDisplayLimit(prev => prev + 20)}>
                        加载更多 ({filteredResults.length - displayLimit})
                    </Button>
                </View>
            )}
        </View>
    )
}
