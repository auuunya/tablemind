import { useState } from 'react'
import { View, Button, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface FileInfo {
    id: string
    name: string
    size: number
    path: string
}

export default function Index() {
    const [files, setFiles] = useState<FileInfo[]>([])
    const [loading, setLoading] = useState(false)

    // 选择文件
    const handleChooseFile = async () => {
        try {
            setLoading(true)

            let res: Taro.chooseMessageFile.SuccessCallbackResult | Taro.chooseFile.SuccessCallbackResult

            try {
                // 1. 优先尝试使用 chooseFile (支持本地文件选择)
                // @ts-ignore
                res = await Taro.chooseFile({
                    count: 5,
                    type: 'file',
                    extension: ['xlsx', 'xls']
                })
            } catch (err) {
                // 2. 如果 chooseFile 失败 (如手机端不支持)，回退到 chooseMessageFile (从聊天记录选择)
                // 只有当错误不是用户取消时才回退
                if (err.errMsg && err.errMsg.indexOf('cancel') > -1) {
                    throw err // 抛出取消错误，由外层捕获
                }

                console.log('chooseFile not supported or failed, falling back to chooseMessageFile', err)
                res = await Taro.chooseMessageFile({
                    count: 5,
                    type: 'file',
                    extension: ['xlsx', 'xls']
                })
            }

            const newFiles: FileInfo[] = res.tempFiles.map((file, index) => ({
                id: `file-${Date.now()}-${index}`,
                name: file.name,
                size: file.size,
                path: file.path
            }))

            setFiles([...files, ...newFiles])

            Taro.showToast({
                title: `已选择 ${newFiles.length} 个文件`,
                icon: 'success'
            })
        } catch (error) {
            console.error('选择文件失败:', error)
            // 用户取消选择不提示错误
            if (error.errMsg && error.errMsg.indexOf('cancel') > -1) {
                return
            }
            Taro.showToast({
                title: '选择文件失败',
                icon: 'error'
            })
        } finally {
            setLoading(false)
        }
    }

    // 删除文件
    const handleRemoveFile = (id: string) => {
        Taro.showModal({
            title: '确认删除',
            content: '确定要删除这个文件吗？',
            success: (res) => {
                if (res.confirm) {
                    setFiles(files.filter(f => f.id !== id))
                }
            }
        })
    }

    // 开始对比
    const handleStartCompare = () => {
        if (files.length < 2) {
            Taro.showToast({
                title: '至少需要2个文件',
                icon: 'none'
            })
            return
        }

        // 跳转到对比页面，传递文件信息
        Taro.navigateTo({
            url: `/pages/compare/index?files=${encodeURIComponent(JSON.stringify(files))}`
        })
    }

    // 格式化文件大小
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    }

    return (
        <View className='index-page'>
            {/* 头部 */}
            <View className='header'>
                <View className='logo'>📊</View>
                <Text className='title'>数表通</Text>
                <Text className='subtitle'>智能Excel数据对比分析</Text>
                <Text className='desc'>本地处理 · 数据安全 · 快速对比</Text>
            </View>

            {/* 上传区域 */}
            <View className='upload-section'>
                <View className='card'>
                    <View className='card-header'>
                        <Text className='card-title'>📁 选择文件</Text>
                        <Text className='card-desc'>支持 .xlsx 和 .xls 格式</Text>
                    </View>

                    <Button
                        className='upload-btn'
                        onClick={handleChooseFile}
                        loading={loading}
                    >
                        {loading ? '加载中...' : '选择Excel文件'}
                    </Button>

                    <View className='tip'>
                        💡 建议上传2个或以上文件进行对比
                    </View>
                </View>
            </View>

            {/* 文件列表 */}
            {files.length > 0 && (
                <View className='files-section'>
                    <View className='section-header'>
                        <Text className='section-title'>已选择文件 ({files.length})</Text>
                    </View>

                    {files.map(file => (
                        <View key={file.id} className='file-item'>
                            <View className='file-icon'>📄</View>
                            <View className='file-info'>
                                <Text className='file-name'>{file.name}</Text>
                                <Text className='file-meta'>{formatSize(file.size)}</Text>
                            </View>
                            <Button
                                className='delete-btn'
                                size='mini'
                                onClick={() => handleRemoveFile(file.id)}
                            >
                                删除
                            </Button>
                        </View>
                    ))}

                    <Button
                        className='compare-btn'
                        type='primary'
                        disabled={files.length < 2}
                        onClick={handleStartCompare}
                    >
                        开始对比 ({files.length} 个文件)
                    </Button>
                </View>
            )}

            {/* 空状态 */}
            {files.length === 0 && (
                <View className='empty'>
                    <Text className='empty-icon'>📂</Text>
                    <Text className='empty-text'>还没有选择文件</Text>
                    <Text className='empty-hint'>点击上方按钮选择Excel文件开始对比</Text>
                </View>
            )}

            {/* 功能介绍 */}
            <View className='features'>
                <View className='feature-item'>
                    <Text className='feature-icon'>⚡</Text>
                    <Text className='feature-title'>快速对比</Text>
                    <Text className='feature-desc'>智能识别差异，秒级生成报告</Text>
                </View>
                <View className='feature-item'>
                    <Text className='feature-icon'>🔒</Text>
                    <Text className='feature-title'>数据安全</Text>
                    <Text className='feature-desc'>本地处理，数据不上传服务器</Text>
                </View>
                <View className='feature-item'>
                    <Text className='feature-icon'>🎯</Text>
                    <Text className='feature-title'>精准匹配</Text>
                    <Text className='feature-desc'>自定义匹配键，灵活配置规则</Text>
                </View>
            </View>
        </View>
    )
}
