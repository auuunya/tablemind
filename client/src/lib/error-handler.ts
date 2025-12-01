/**
 * 用户友好的错误消息转换工具
 * 将技术错误转换为非技术用户能理解的描述
 */

export interface UserFriendlyError {
    title: string;
    message: string;
    suggestions: string[];
    severity: 'error' | 'warning' | 'info';
}

/**
 * 将技术错误转换为用户友好的错误消息
 */
export function translateError(error: Error | unknown): UserFriendlyError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // 文件读取错误
    if (lowerMessage.includes('file') || lowerMessage.includes('read')) {
        return {
            title: '无法读取文件',
            message: '这个文件可能已损坏、格式不正确，或者不是有效的Excel文件。',
            suggestions: [
                '确保文件是 .xlsx 或 .xls 格式',
                '尝试用Excel或WPS打开文件，检查是否正常',
                '如果文件有密码保护，请先解除密码',
                '重新保存文件后再试'
            ],
            severity: 'error'
        };
    }

    // 内存错误
    if (lowerMessage.includes('memory') || lowerMessage.includes('heap')) {
        return {
            title: '文件太大',
            message: '文件数据量超过了浏览器的处理能力，导致内存不足。',
            suggestions: [
                '尝试删除文件中不需要的列',
                '将数据分成多个小文件分批处理',
                '关闭其他浏览器标签页释放内存',
                '推荐单个文件不超过10MB或20,000行'
            ],
            severity: 'error'
        };
    }

    // 解析错误
    if (lowerMessage.includes('parse') || lowerMessage.includes('invalid')) {
        return {
            title: '数据格式异常',
            message: '文件中的某些数据格式无法被正确识别。',
            suggestions: [
                '检查是否有合并单元格，建议取消合并',
                '确保表格是标准格式（第一行是列名）',
                '检查是否有特殊字符或公式错误',
                '尝试将文件另存为新的Excel文件'
            ],
            severity: 'warning'
        };
    }

    // 网络错误
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
        return {
            title: '网络连接问题',
            message: '无法连接到服务器或网络连接中断。',
            suggestions: [
                '检查您的网络连接',
                '刷新页面重试',
                '如果使用VPN,尝试关闭后重试'
            ],
            severity: 'error'
        };
    }

    // 权限错误
    if (lowerMessage.includes('permission') || lowerMessage.includes('access')) {
        return {
            title: '文件访问受限',
            message: '浏览器无法访问该文件。',
            suggestions: [
                '确保文件没有被其他程序占用',
                '检查文件是否设置了只读或其他权限限制',
                '尝试将文件复制到其他位置后重试'
            ],
            severity: 'error'
        };
    }

    // Sheet不存在
    if (lowerMessage.includes('sheet') && lowerMessage.includes('not found')) {
        return {
            title: '找不到工作表',
            message: '选择的工作表(Sheet)在文件中不存在，可能文件已被修改。',
            suggestions: [
                '重新上传文件',
                '检查文件中的工作表名称',
                '确保选择了正确的Sheet'
            ],
            severity: 'warning'
        };
    }

    // 数据类型错误
    if (lowerMessage.includes('type') || lowerMessage.includes('undefined')) {
        return {
            title: '数据处理异常',
            message: '数据中存在意外的格式或空值。',
            suggestions: [
                '检查表格中是否有空行或空列',
                '确保所有列都有列名（第一行）',
                '检查是否有#N/A、#REF!等Excel错误值',
                '尝试删除空行和空列'
            ],
            severity: 'warning'
        };
    }

    // 默认错误
    return {
        title: '操作失败',
        message: '抱歉，发生了一个未知错误。这可能是程序bug或数据格式问题。',
        suggestions: [
            '尝试刷新页面重新开始',
            '检查文件是否正常',
            '如果问题持续，请联系技术支持并提供错误详情',
            `错误详情: ${errorMessage.substring(0, 100)}`
        ],
        severity: 'error'
    };
}

/**
 * 显示用户友好的错误提示
 */
export function showFriendlyError(error: Error | unknown, showToast?: (props: any) => void) {
    const friendlyError = translateError(error);

    if (showToast) {
        showToast({
            title: friendlyError.title,
            description: friendlyError.message,
            variant: friendlyError.severity === 'error' ? 'destructive' : 'default',
        });
    }

    // 同时在控制台输出原始错误，方便调试
    console.error('[原始错误]', error);
    console.info('[用户友好提示]', friendlyError);

    return friendlyError;
}

/**
 * 文件验证工具
 */
export function validateFile(file: File): { valid: boolean; error?: UserFriendlyError } {
    // 检查文件类型
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
        return {
            valid: false,
            error: {
                title: '不支持的文件格式',
                message: `文件 "${file.name}" 不是有效的Excel文件。`,
                suggestions: [
                    '只支持 .xlsx 和 .xls 格式的Excel文件',
                    '如果您有CSV或其他格式，请用Excel打开后另存为.xlsx',
                    '确保文件扩展名正确'
                ],
                severity: 'error'
            }
        };
    }

    // 检查文件大小 (建议不超过20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
        return {
            valid: false,
            error: {
                title: '文件太大',
                message: `文件 "${file.name}" 超过了建议的大小限制 (${(file.size / 1024 / 1024).toFixed(1)}MB)。`,
                suggestions: [
                    '建议单个文件不超过20MB',
                    '尝试删除不需要的列或行',
                    '将数据分成多个小文件',
                    '您仍可以尝试上传，但可能会比较慢'
                ],
                severity: 'warning'
            }
        };
    }

    // 检查文件大小是否为0
    if (file.size === 0) {
        return {
            valid: false,
            error: {
                title: '文件为空',
                message: `文件 "${file.name}" 是空的，没有任何数据。`,
                suggestions: [
                    '检查是否选择了正确的文件',
                    '确保文件中有数据内容',
                    '尝试重新保存文件'
                ],
                severity: 'error'
            }
        };
    }

    return { valid: true };
}

/**
 * 数据验证工具
 */
export interface DataValidationResult {
    valid: boolean;
    warnings: string[];
    errors: string[];
}

export function validateSheetData(data: any[][], sheetName: string): DataValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 检查是否为空
    if (!data || data.length === 0) {
        errors.push(`工作表"${sheetName}"没有数据`);
        return { valid: false, warnings, errors };
    }

    // 检查是否只有表头
    if (data.length === 1) {
        warnings.push(`工作表"${sheetName}"只有标题行，没有数据行`);
    }

    // 检查表头
    const headers = data[0];
    if (!headers || headers.length === 0) {
        errors.push(`工作表"${sheetName}"缺少列标题`);
        return { valid: false, warnings, errors };
    }

    // 检查是否有空列名
    const emptyHeaders = headers.filter((h: any) => !h || String(h).trim() === '');
    if (emptyHeaders.length > 0) {
        warnings.push(`工作表"${sheetName}"有${emptyHeaders.length}个空列名，建议为所有列命名`);
    }

    // 检查重复列名
    const headerCounts = new Map<string, number>();
    headers.forEach((h: any) => {
        const name = String(h || '').trim();
        headerCounts.set(name, (headerCounts.get(name) || 0) + 1);
    });
    const duplicates = Array.from(headerCounts.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name);
    if (duplicates.length > 0) {
        warnings.push(`工作表"${sheetName}"有重复的列名: ${duplicates.join(', ')}`);
    }

    // 检查数据行
    const dataRows = data.slice(1);
    let emptyRowCount = 0;
    dataRows.forEach((row, idx) => {
        const isEmpty = !row || row.every((cell: any) => !cell || String(cell).trim() === '');
        if (isEmpty) emptyRowCount++;
    });

    if (emptyRowCount > 0) {
        warnings.push(`工作表"${sheetName}"有${emptyRowCount}个空行，建议删除空行`);
    }

    return {
        valid: errors.length === 0,
        warnings,
        errors
    };
}
