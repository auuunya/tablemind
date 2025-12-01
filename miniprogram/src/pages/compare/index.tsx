import { useState, useEffect } from 'react'
import { View, Button, Text, Checkbox, ScrollView, Picker, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { readExcelFile, getSheetData, generateDiff } from '../../utils/excel'
import { FileState, ComparisonGroup, ColumnMapping } from '../../types'
import './index.scss'
import { useTranslation } from 'react-i18next';

export default function Compare() {
    const { t } = useTranslation();
    const router = useRouter()
    const [files, setFiles] = useState<FileState[]>([])
    const [groups, setGroups] = useState<ComparisonGroup[]>([{
        id: `group-${Date.now()}`,
        name: '对比组 1',
        selectedFileIds: [],
        mappings: [],
        keyFields: [],
        diffFields: [],
        results: [],
        status: 'pending'
    }])

    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1) // 1: 准备数据, 2: 分组与映射, 3: 配置规则

    // 状态管理
    const [newFieldName, setNewFieldName] = useState('')
    const [activeGroupId, setActiveGroupId] = useState<string>('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [previewFileId, setPreviewFileId] = useState<string | null>(null)

    useEffect(() => {
        const filesParam = router.params.files
        if (filesParam) {
            try {
                const fileInfos = JSON.parse(decodeURIComponent(filesParam))
                loadFilesData(fileInfos)
            } catch (error) {
                console.error('解析参数失败:', error)
            }
        }
    }, [])

    const loadFilesData = async (fileInfos: any[]) => {
        setLoading(true)
        Taro.showLoading({ title: '读取文件中...' })

        try {
            const loadedFiles: FileState[] = []
            const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6']

            for (let i = 0; i < fileInfos.length; i++) {
                const info = fileInfos[i]
                try {
                    const { workbook, sheets } = await readExcelFile(info.path)
                    const data = getSheetData(workbook, sheets[0])

                    loadedFiles.push({
                        ...info,
                        sheets,
                        selectedSheet: sheets[0],
                        data,
                        color: colors[i % colors.length],
                        // @ts-ignore
                        workbook
                    })
                } catch (err) {
                    console.error(`文件 ${info.name} 读取失败`, err)
                }
            }

            setFiles(loadedFiles)
            // 默认将所有文件加入第一个组
            setGroups(prev => [{
                ...prev[0],
                selectedFileIds: loadedFiles.map(f => f.id)
            }])

            Taro.hideLoading()
        } catch (error) {
            Taro.hideLoading()
            Taro.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    // 切换 Sheet
    const handleSheetChange = async (fileId: string, sheetName: string) => {
        const fileIndex = files.findIndex(f => f.id === fileId)
        if (fileIndex === -1) return

        const file = files[fileIndex]
        // @ts-ignore
        if (!file.workbook) return

        try {
            Taro.showLoading({ title: '切换工作表...' })
            // @ts-ignore
            const data = getSheetData(file.workbook, sheetName)

            const newFiles = [...files]
            newFiles[fileIndex] = {
                ...file,
                selectedSheet: sheetName,
                data
            }
            setFiles(newFiles)
            Taro.hideLoading()
        } catch (error) {
            Taro.hideLoading()
            Taro.showToast({ title: '切换失败', icon: 'none' })
        }
    }

    // 删除文件
    const removeFile = (fileId: string) => {
        setFiles(files.filter(f => f.id !== fileId))
        // 同时从所有组中移除该文件
        setGroups(groups.map(g => ({
            ...g,
            selectedFileIds: g.selectedFileIds.filter(id => id !== fileId)
        })))
    }

    // 添加对比组
    const addGroup = () => {
        const newGroup: ComparisonGroup = {
            id: `group-${Date.now()}`,
            name: `对比组 ${groups.length + 1}`,
            selectedFileIds: [],
            mappings: [],
            keyFields: [],
            diffFields: [],
            results: [],
            status: 'pending'
        }
        setGroups([...groups, newGroup])
    }

    // 删除对比组
    const removeGroup = (groupId: string) => {
        if (groups.length <= 1) {
            Taro.showToast({ title: '至少保留一个对比组', icon: 'none' })
            return
        }
        setGroups(groups.filter(g => g.id !== groupId))
    }

    // 更新组信息
    const updateGroup = (groupId: string, updates: Partial<ComparisonGroup>) => {
        setGroups(groups.map(g => g.id === groupId ? { ...g, ...updates } : g))
    }

    // 自动映射
    const autoMap = (groupId: string) => {
        const group = groups.find(g => g.id === groupId)
        if (!group) return

        const selectedFiles = files.filter(f => group.selectedFileIds.includes(f.id))
        if (selectedFiles.length === 0) return

        const baseFile = selectedFiles[0]
        if (!baseFile.data) return

        const newMappings: ColumnMapping[] = []

        baseFile.data.headers.forEach(header => {
            const mapping: ColumnMapping = {
                targetField: header,
                sourceFields: { [baseFile.id]: header }
            }

            selectedFiles.slice(1).forEach(file => {
                if (file.data?.headers.includes(header)) {
                    mapping.sourceFields[file.id] = header
                }
            })

            newMappings.push(mapping)
        })

        updateGroup(groupId, { mappings: newMappings })
        Taro.showToast({ title: `已匹配 ${newMappings.length} 个字段`, icon: 'success' })
    }

    // 打开添加字段弹窗
    const openAddModal = (groupId: string) => {
        setActiveGroupId(groupId)
        setNewFieldName('')
        setShowAddModal(true)
    }

    // 确认添加字段
    const confirmAddField = () => {
        if (!newFieldName.trim() || !activeGroupId) return

        const group = groups.find(g => g.id === activeGroupId)
        if (group) {
            const newMapping: ColumnMapping = {
                targetField: newFieldName.trim(),
                sourceFields: {}
            }
            updateGroup(activeGroupId, {
                mappings: [...group.mappings, newMapping]
            })
        }

        setShowAddModal(false)
        setNewFieldName('')
    }

    // 更新映射
    const updateMapping = (groupId: string, mappingIndex: number, fileId: string, column: string) => {
        const group = groups.find(g => g.id === groupId)
        if (!group) return

        const newMappings = [...group.mappings]
        newMappings[mappingIndex].sourceFields[fileId] = column
        updateGroup(groupId, { mappings: newMappings })
    }

    // 删除映射
    const removeMapping = (groupId: string, mappingIndex: number) => {
        const group = groups.find(g => g.id === groupId)
        if (!group) return

        const newMappings = [...group.mappings]
        newMappings.splice(mappingIndex, 1)
        updateGroup(groupId, { mappings: newMappings })
    }

    // 开始对比
    const startCompare = () => {
        for (const group of groups) {
            if (group.selectedFileIds.length < 2) {
                Taro.showToast({ title: `${group.name} 至少需要选择2个文件`, icon: 'none' })
                return
            }
            if (group.keyFields.length === 0 || group.diffFields.length === 0) {
                Taro.showToast({ title: `请完善 ${group.name} 的配置`, icon: 'none' })
                return
            }
        }

        setLoading(true)
        Taro.showLoading({ title: '对比中...' })

        try {
            const processedGroups = groups.map(group => {
                const selectedFiles = files.filter(f => group.selectedFileIds.includes(f.id))
                const results = generateDiff(selectedFiles, group.mappings, group.keyFields, group.diffFields)
                return { ...group, results, status: 'done' }
            })

            // 深度清理数据，确保只保留纯数据
            const cleanFiles = files.map(f => ({
                id: f.id,
                name: f.name,
                size: f.size,
                path: f.path,
                sheets: f.sheets,
                selectedSheet: f.selectedSheet,
                color: f.color,
                // 只保留必要的 data 属性，不保留 workbook
                data: f.data ? {
                    headers: f.data.headers,
                    rows: f.data.rows
                } : null
            }))

            const cleanGroups = processedGroups.map(g => ({
                id: g.id,
                name: g.name,
                selectedFileIds: g.selectedFileIds,
                mappings: g.mappings,
                keyFields: g.keyFields,
                diffFields: g.diffFields,
                status: g.status,
                results: g.results.map(r => ({
                    key: r.key,
                    status: r.status,
                    rows: r.rows,
                    diffs: r.diffs
                }))
            }))

            Taro.hideLoading()
            Taro.navigateTo({
                url: `/pages/result/index?groups=${encodeURIComponent(JSON.stringify(cleanGroups))}&files=${encodeURIComponent(JSON.stringify(cleanFiles))}`
            })
        } catch (error) {
            Taro.hideLoading()
            console.error(error)
            Taro.showToast({ title: '对比失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    // 获取预览文件数据
    const getPreviewFile = () => {
        return files.find(f => f.id === previewFileId)
    }

    return (
        <View className='compare-page'>
            {/* 步骤1: 准备数据 */}
            {step === 1 && (
                <View className='step-section'>
                    <View className='section-header'>
                        <Text className='section-title'>1. 准备数据</Text>
                        <Text className='section-desc'>确认文件和工作表</Text>
                    </View>

                    <View className='file-table-container'>
                        <View className='file-table'>
                            {/* 表头 */}
                            <View className='table-header'>
                                <Text className='th name'>文件名</Text>
                                <Text className='th sheet'>Sheet</Text>
                                <Text className='th meta'>行列数</Text>
                                <Text className='th action'>操作</Text>
                            </View>

                            {/* 文件列表 */}
                            {files.map((file) => (
                                <View key={file.id} className='table-row'>
                                    <Text className='td name'>{file.name}</Text>
                                    <View className='td sheet'>
                                        <Picker
                                            mode='selector'
                                            range={file.sheets}
                                            value={file.sheets.indexOf(file.selectedSheet)}
                                            onChange={(e) => handleSheetChange(file.id, file.sheets[e.detail.value])}
                                        >
                                            <View className='picker-value'>{file.selectedSheet} ▾</View>
                                        </Picker>
                                    </View>
                                    <Text className='td meta'>
                                        {file.data?.rows.length || 0} x {file.data?.headers.length || 0}
                                    </Text>
                                    <View className='td action'>
                                        <Text className='btn preview' onClick={() => setPreviewFileId(file.id)}>预览</Text>
                                        <Text className='btn delete' onClick={() => removeFile(file.id)}>删除</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 预览区域 */}
                    {previewFileId && getPreviewFile() && (
                        <View className='preview-panel'>
                            <View className='panel-header'>
                                <Text className='panel-title'>数据预览: {getPreviewFile()?.name}</Text>
                                <Button size='mini' className='close-btn' onClick={() => setPreviewFileId(null)}>关闭预览</Button>
                            </View>
                            <ScrollView scrollX scrollY className='preview-scroll'>
                                <View className='preview-grid'>
                                    {/* 表头 */}
                                    <View className='grid-row header'>
                                        {getPreviewFile()?.data?.headers.map((h, i) => (
                                            <Text key={i} className='grid-cell'>{h}</Text>
                                        ))}
                                    </View>
                                    {/* 数据行 */}
                                    {getPreviewFile()?.data?.rows.slice(0, 10).map((row, i) => (
                                        <View key={i} className='grid-row'>
                                            {getPreviewFile()?.data?.headers.map((h, j) => (
                                                <Text key={j} className='grid-cell'>{String(row[h] || '-')}</Text>
                                            ))}
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    )}

                </View>
            )}

            {/* 步骤2: 分组与映射 */}
            {step === 2 && (
                <View className='step-section'>
                    <View className='section-header'>
                        <Text className='section-title'>2. 分组与映射</Text>
                        <Text className='section-desc'>创建对比组，选择文件并配置字段映射</Text>
                    </View>

                    <ScrollView scrollY className='groups-list'>
                        {groups.map((group) => (
                            <View key={group.id} className='group-card'>
                                <View className='group-header'>
                                    <Input
                                        className='group-name-input'
                                        value={group.name}
                                        onInput={e => updateGroup(group.id, { name: e.detail.value })}
                                    />
                                    <Text className='delete-btn' onClick={() => removeGroup(group.id)}>删除组</Text>
                                </View>

                                <View className='group-files'>
                                    <Text className='sub-title'>选择参与对比的文件：</Text>
                                    <View className='file-checkboxes'>
                                        {files.map(file => (
                                            <View key={file.id} className='checkbox-item'>
                                                <Checkbox
                                                    checked={group.selectedFileIds.includes(file.id)}
                                                    onClick={() => {
                                                        const ids = group.selectedFileIds.includes(file.id)
                                                            ? group.selectedFileIds.filter(id => id !== file.id)
                                                            : [...group.selectedFileIds, file.id]
                                                        updateGroup(group.id, { selectedFileIds: ids })
                                                    }}
                                                />
                                                <Text className='file-name'>{file.name}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {group.selectedFileIds.length >= 2 && (
                                    <View className='group-mappings'>
                                        <View className='mapping-actions'>
                                            <Text className='sub-title'>字段映射：</Text>
                                            <View className='btns'>
                                                <Button size='mini' onClick={() => openAddModal(group.id)}>+ {t("buttons.addField")}</Button>
                                                <Button size='mini' type='primary' onClick={() => autoMap(group.id)}>{t("buttons.autoMatch")}</Button>
                                            </View>
                                        </View>

                                        <View className='mapping-table'>
                                            <View className='table-header'>
                                                <Text className='col-unified'>统一字段名</Text>
                                                {files.filter(f => group.selectedFileIds.includes(f.id)).map(f => (
                                                    <Text key={f.id} className='col-file'>{f.name}</Text>
                                                ))}
                                                <Text className='col-action'>操作</Text>
                                            </View>

                                            {group.mappings.map((m, mIndex) => (
                                                <View key={mIndex} className='table-row'>
                                                    <Text className='col-unified'>{m.targetField}</Text>
                                                    {files.filter(f => group.selectedFileIds.includes(f.id)).map(f => (
                                                        <View key={f.id} className='col-file'>
                                                            <Picker
                                                                mode='selector'
                                                                range={['(空)', ...(f.data?.headers || [])]}
                                                                onChange={(e) => {
                                                                    const val = e.detail.value
                                                                    // @ts-ignore
                                                                    const col = val === 0 ? '' : f.data?.headers[val - 1]
                                                                    updateMapping(group.id, mIndex, f.id, col)
                                                                }}
                                                            >
                                                                <View className={`picker-text ${m.sourceFields[f.id] ? '' : 'empty'}`}>
                                                                    {m.sourceFields[f.id] || '-'}
                                                                </View>
                                                            </Picker>
                                                        </View>
                                                    ))}
                                                    <Text className='col-action delete' onClick={() => removeMapping(group.id, mIndex)}>×</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))}

                        <Button className='add-group-btn' onClick={addGroup}>+ 添加对比组</Button>
                    </ScrollView >

                </View >
            )
            }

            {/* 步骤3: 配置规则 */}
            {
                step === 3 && (
                    <View className='step-section'>
                        <View className='section-header'>
                            <Text className='section-title'>3. 配置规则</Text>
                            <Text className='section-desc'>为每个对比组设置匹配键和对比字段</Text>
                        </View>

                        <ScrollView scrollY className='config-list'>
                            {groups.map((group) => (
                                <View key={group.id} className='group-card'>
                                    <View className='group-header'>
                                        <Input
                                            className='group-name-input'
                                            value={group.name}
                                            onInput={e => updateGroup(group.id, { name: e.detail.value })}
                                        />
                                        <Text className='delete-btn' onClick={() => removeGroup(group.id)}>删除</Text>
                                    </View>

                                    <View className='config-section'>
                                        <Text className='config-title'>🔑 唯一匹配键 (Key)</Text>
                                        <View className='checkbox-grid'>
                                            {group.mappings.map(m => (
                                                <View key={m.targetField} className='checkbox-item'>
                                                    <Checkbox
                                                        checked={group.keyFields.includes(m.targetField)}
                                                        onClick={() => {
                                                            const newKeys = group.keyFields.includes(m.targetField)
                                                                ? group.keyFields.filter(k => k !== m.targetField)
                                                                : [...group.keyFields, m.targetField]
                                                            updateGroup(group.id, { keyFields: newKeys })
                                                        }}
                                                    />
                                                    <Text>{m.targetField}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    <View className='config-section'>
                                        <Text className='config-title'>📊 对比字段 (Values)</Text>
                                        <View className='checkbox-grid'>
                                            {group.mappings.filter(m => !group.keyFields.includes(m.targetField)).map(m => (
                                                <View key={m.targetField} className='checkbox-item'>
                                                    <Checkbox
                                                        checked={group.diffFields.includes(m.targetField)}
                                                        onClick={() => {
                                                            const newDiffs = group.diffFields.includes(m.targetField)
                                                                ? group.diffFields.filter(k => k !== m.targetField)
                                                                : [...group.diffFields, m.targetField]
                                                            updateGroup(group.id, { diffFields: newDiffs })
                                                        }}
                                                    />
                                                    <Text>{m.targetField}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            ))}

                            <Button className='add-group-btn' onClick={addGroup}>+ 添加对比规则</Button>
                        </ScrollView>


                    </View>
                )
            }

            {/* 添加字段弹窗 */}
            {
                showAddModal && (
                    <View className='modal-mask'>
                        <View className='modal-content'>
                            <Text className='modal-title'>添加统一字段名</Text>
                            <Input
                                className='modal-input'
                                placeholder='请输入字段名称'
                                value={newFieldName}
                                onInput={e => setNewFieldName(e.detail.value)}
                            />
                            <View className='modal-actions'>
                                <Button size='mini' onClick={() => setShowAddModal(false)}>取消</Button>
                                <Button size='mini' type='primary' onClick={confirmAddField}>确定</Button>
                            </View>
                        </View>
                    </View>
                )
            }

            {/* 底部导航 */}
            <View className='step-nav'>
                <View className='nav-left'>
                    {step > 1 ? (
                        <Button className='nav-btn secondary' onClick={() => setStep(step - 1)}>上一步</Button>
                    ) : <View />}
                </View>

                <Text className='step-indicator'>{step} / 3</Text>

                <View className='nav-right'>
                    {step === 1 && (
                        <Button
                            className='nav-btn primary'
                            disabled={files.length < 1}
                            onClick={() => setStep(2)}
                        >
                            下一步
                        </Button>
                    )}
                    {step === 2 && (
                        <Button
                            className='nav-btn primary'
                            onClick={() => setStep(3)}
                        >
                            下一步
                        </Button>
                    )}
                    {step === 3 && (
                        <Button
                            className='nav-btn primary'
                            onClick={startCompare}
                        >
                            查看结果
                        </Button>
                    )}
                </View>
            </View>
        </View >
    )
}
