# 投资情景的计量与边界

应用中的默认值和三个预设均为可编辑示例，不代表候选物业的实绩、需求预测或供应商报价。所有金额为 USD。示例不假设利用率增长、补贴、广告或商户增购收入。

设 n 为枪数，s 为每枪每个日历日的充电次数，e 为每次交付 kWh：

```text
Q = n × s × e × 365                    年交付电量
Grid = Q / (1 - loss)                  年购电量
Revenue = Q × realized_price
Energy = Grid × energy_rate
Service = Q × service_fee
Demand = billing_peak_kW × monthly_demand_rate × 12
Fixed = monthly_fixed_cost × 12
Operating cash = Revenue - Energy - Service - Demand - Fixed
Contribution/kWh = realized_price - energy_rate/(1-loss) - service_fee
Break-even sessions/stall/day = (Demand+Fixed) / (365×n×e×Contribution/kWh)
Simple payback = capex / Operating cash, only if Operating cash > 0
```

边际贡献不为正时不存在有限经营盈亏平衡点；现金贡献不为正时不显示虚构的回收期。经营盈亏平衡不包含资本回收。简单回收期忽略资金时间价值和建设期，不是 IRR。

## 两种电价口径

**能量单价 + 单列需量费**适合初步拆分分析。最终账单还可能包含最低账单、分时/季节费率、需量回溯、固定费、功率因数、税费及附加项。示例中的计费峰值并非设备铭牌功率，也不是通过每年电量自动推算出的峰值。

**综合电价**必须关闭单列需量费，防止重复计算。供应商综合电价通常依赖其负荷结构；不能保持单位电价不变就推演极低利用率。模型把输入电价定义为每购入 kWh 的费用、平台费定义为每交付 kWh 的费用，实际合同必须确认计量点和分母。

## 官方估算器检查

2026-10-30 读取 [Tesla 公开估算器](https://www.tesla.com/supercharger-for-business/get) 的一个商业地址示例：8 枪界面显示硬件估算 $500,000、安装 Medium 档 $55,000/枪及 $940,000 合计；平台费显示 $0.10/kWh，最终价格需询价。其电价说明包含需量费。界面还披露增长、损耗、零租金和税费排除假设。因此本产品没有把其展示的回收期或销量当作推荐物业收益。

第三方自己定价、负责安装及现场维护的模式来自 [Tesla 官方项目说明](https://www.tesla.com/learn/supercharger-for-business)。最终成本分工以合同为准，包含在服务费中的设备维护和支付处理不能再完整重复计入。

## 费率原文的用途

[Snohomish PUD 2026 正式费率表](https://www.snopud.com/wp-content/uploads/2025/10/ElectricRates_2026.pdf) 的 Schedule 20EV（PDF 第 7–9 页）规定单独计量公共 EV 充电的适用条件。2026-04 起包含日固定费、首 100 kW 需量豁免、分段电量费和连接负载最低账单；到期安排也影响多年分析。不能只抽一个便宜的电量单价。

[Clark Public Utilities 当前费率](https://www.clarkpublicutilities.com/about-cpu/public-documents/current-electric-water-rates/) 列出商用基本费、能量费与需量费。服务区域、次级/初级供电类别、转售许可、税费和接网条件仍须逐物业确认。本版本通用计算器没有声称完整实现这些正式账单。

固定支出需要涵盖租金、保险、清洁、管理及适用维护。总投资需涵盖硬件、土建、接网、设计许可、土地相关成本、税费和预备金。模型未计所得税、融资、折旧、替换资本开支、施工延期和期末残值，亦未验证真实成交价格与利用率。

## 补贴时点

本版本补贴收入为零。[IRS 对 30C 的现行说明](https://www.irs.gov/credits-deductions/alternative-fuel-vehicle-refueling-property-credit)把适用投运时间列为 2023-01-01 至 2026-06-30。2026 年 10 月才进入选址的新项目不能直接套用旧版 30C 优惠。其他补贴也必须逐项目确认资格、资金可得性和合规成本，不能用来补足未经验证的经营需求。
