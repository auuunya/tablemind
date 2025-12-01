/**
 * 演示数据模块
 * 为新手引导提供预置的示例数据
 */

export const demoData = {
    // 示例文件1：本周销售数据（20条记录）
    thisWeekSales: [
        ['商品ID', '商品名称', '销售数量', '销售金额', '门店'],
        ['P001', 'iPhone 15 Pro', 120, 119880, '北京旗舰店'],
        ['P002', 'MacBook Pro 14寸', 45, 134955, '北京旗舰店'],
        ['P003', 'iPad Air 5代', 80, 47920, '北京旗舰店'],
        ['P004', 'AirPods Pro 2代', 200, 39960, '北京旗舰店'],
        ['P005', 'Apple Watch Series 9', 65, 25935, '北京旗舰店'],
        ['P006', 'Magic Keyboard', 88, 13200, '北京旗舰店'],
        ['P007', 'Magic Mouse', 110, 7790, '北京旗舰店'],
        ['P008', 'HomePod mini', 55, 5445, '北京旗舰店'],
        ['P009', 'Apple TV 4K', 32, 11840, '北京旗舰店'],
        ['P010', 'AirTag 4件装', 95, 7125, '北京旗舰店'],
        ['P011', 'iPhone 15', 150, 89850, '北京旗舰店'],
        ['P012', 'iPad Pro 11寸', 40, 63960, '北京旗舰店'],
        ['P013', 'MacBook Air M2', 55, 76945, '北京旗舰店'],
        ['P014', 'Apple Pencil 2代', 120, 11880, '北京旗舰店'],
        ['P015', 'MagSafe充电器', 200, 11980, '北京旗舰店'],
        ['P017', 'Studio Display', 8, 99920, '北京旗舰店'],
        ['P018', 'Mac mini M2', 25, 39975, '北京旗舰店'],
        ['P019', 'iPhone 14', 75, 44925, '北京旗舰店'],
        ['P020', 'AirPods 3代', 130, 14170, '北京旗舰店']
    ],

    // 示例文件2：上周销售数据（20条记录）
    lastWeekSales: [
        ['商品编号', '产品名称', '数量', '金额', '店铺'],
        ['P001', 'iPhone 15 Pro', 100, 99900, '北京旗舰店'],      // 差异：数量和金额都不同
        ['P002', 'MacBook Pro 14寸', 45, 134955, '北京旗舰店'],   // 匹配：完全相同
        ['P003', 'iPad Air 5代', 65, 38935, '北京旗舰店'],        // 差异：数量和金额不同
        ['P004', 'AirPods Pro 2代', 200, 39960, '北京旗舰店'],    // 匹配：完全相同
        ['P005', 'Apple Watch Series 9', 50, 19950, '北京旗舰店'], // 差异：数量和金额不同
        ['P006', 'Magic Keyboard', 75, 11250, '北京旗舰店'],      // 差异：数量和金额不同
        ['P007', 'Magic Mouse', 110, 7790, '北京旗舰店'],         // 匹配：完全相同
        ['P008', 'HomePod mini', 60, 5940, '北京旗舰店'],         // 差异：数量和金额不同
        ['P009', 'Apple TV 4K', 32, 11840, '北京旗舰店'],         // 匹配：完全相同
        ['P010', 'AirTag 4件装', 100, 7500, '北京旗舰店'],        // 差异：数量和金额不同
        ['P011', 'iPhone 15', 150, 89850, '北京旗舰店'],          // 匹配：完全相同
        ['P012', 'iPad Pro 11寸', 35, 55965, '北京旗舰店'],       // 差异：数量和金额不同
        ['P013', 'MacBook Air M2', 55, 76945, '北京旗舰店'],      // 匹配：完全相同
        ['P014', 'Apple Pencil 2代', 100, 9900, '北京旗舰店'],    // 差异：数量和金额不同
        ['P015', 'MagSafe充电器', 200, 11980, '北京旗舰店'],      // 匹配：完全相同
        ['P016', 'Mac Studio M2', 5, 149975, '北京旗舰店'],       // 缺失：上周有，本周无
        ['P018', 'Mac mini M2', 20, 31980, '北京旗舰店'],         // 差异：数量和金额不同
        ['P019', 'iPhone 14', 75, 44925, '北京旗舰店'],           // 匹配：完全相同
        ['P020', 'AirPods 3代', 150, 16350, '北京旗舰店']         // 差异：数量和金额不同
    ]
};

/**
 * 生成演示用的File对象
 */
export function createDemoFiles(): { file1: File; file2: File } {
    // 注意：这里创建的是虚拟File对象，实际会在组件中处理
    const file1 = new File(
        [JSON.stringify(demoData.thisWeekSales)],
        '本周销售数据.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const file2 = new File(
        [JSON.stringify(demoData.lastWeekSales)],
        '上周销售数据.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    return { file1, file2 };
}

/**
 * 演示模式的初始状态
 * 包含预处理好的文件和对比组配置
 */
export interface DemoState {
    files: any[];
    groups: any[];
    step: number;
}

export function getDemoInitialState(): DemoState {
    // 转换演示数据为正确的格式（对象数组）
    const convertToObjectArray = (rawData: any[][]): any[] => {
        const headers = rawData[0] as string[];
        return rawData.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });
    };

    return {
        files: [
            {
                id: 'demo-file-1',
                name: '本周销售数据.xlsx',
                sheets: ['Sheet1'],
                selectedSheet: 'Sheet1',
                data: {
                    headers: demoData.thisWeekSales[0] as string[],
                    rows: convertToObjectArray(demoData.thisWeekSales)
                },
                color: '#6366f1'
            },
            {
                id: 'demo-file-2',
                name: '上周销售数据.xlsx',
                sheets: ['Sheet1'],
                selectedSheet: 'Sheet1',
                data: {
                    headers: demoData.lastWeekSales[0] as string[],
                    rows: convertToObjectArray(demoData.lastWeekSales)
                },
                color: '#ec4899'
            }
        ],
        groups: [
            {
                id: 'demo-group-1',
                name: '本周与上周销售对比',
                selectedFileIds: ['demo-file-1', 'demo-file-2'],
                mappings: [
                    {
                        targetField: '商品ID',
                        sourceFields: {
                            'demo-file-1': '商品ID',
                            'demo-file-2': '商品编号'
                        }
                    },
                    {
                        targetField: '商品名称',
                        sourceFields: {
                            'demo-file-1': '商品名称',
                            'demo-file-2': '产品名称'
                        }
                    },
                    {
                        targetField: '销售数量',
                        sourceFields: {
                            'demo-file-1': '销售数量',
                            'demo-file-2': '数量'
                        }
                    },
                    {
                        targetField: '销售金额',
                        sourceFields: {
                            'demo-file-1': '销售金额',
                            'demo-file-2': '金额'
                        }
                    }
                ],
                keyFields: ['商品ID'],
                diffFields: ['销售数量', '销售金额'],
                results: [],
                status: 'pending' as const
            }
        ],
        step: 2  // 直接跳到对比组页面
    };
}
