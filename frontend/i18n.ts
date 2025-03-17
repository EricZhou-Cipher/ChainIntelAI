"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 不要在SSR环境中执行
if (typeof window !== 'undefined') {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: {
            // 通用
            "welcome": "Welcome to ChainIntelAI",
            "dashboard_nav": "Dashboard",
            "transactions_nav": "Transactions",
            "addresses_nav": "Addresses",
            "analytics": "Analytics",
            "settings": "Settings",
            
            // 全局搜索
            "globalSearch": {
              "placeholder": "Search address or transaction...",
              "label": "Search",
              "noResults": "No results found",
              "searching": "Searching..."
            },
            
            // 风险等级
            "riskLevels": {
              "low": "Low Risk",
              "medium": "Medium Risk",
              "high": "High Risk",
              "critical": "Critical Risk",
              "unknown": "Unknown Risk"
            },
            
            // 仪表盘页面
            "dashboardPage": {
              "title": "Dashboard",
              "subtitle": "Monitor blockchain activities and risk alerts",
              "stats": {
                "todayTransactions": "Today's Transactions",
                "highRiskAlerts": "High Risk Alerts",
                "avgProcessingTime": "Avg. Processing Time",
                "monitoredAddresses": "Monitored Addresses"
              },
              "charts": {
                "riskDistribution": "Risk Distribution",
                "chainDistribution": "Chain Distribution",
                "riskTrend": "Risk Trend",
                "noData": "No data available",
                "checkBack": "Please check back later",
                "7days": "7 Days",
                "30days": "30 Days",
                "90days": "90 Days"
              },
              "alerts": {
                "title": "Recent Alerts",
                "viewAll": "View All",
                "noAlerts": "No alerts",
                "allClear": "All systems are running smoothly",
                "showMore": "Show more",
                "showLess": "Show less",
                "investigate": "Investigate",
                "types": {
                  "suspicious-transaction": "Suspicious Transaction",
                  "blacklist-address": "Blacklisted Address",
                  "unusual-activity": "Unusual Activity"
                },
                "details": {
                  "address": "Address",
                  "transaction": "Transaction",
                  "amount": "Amount",
                  "timestamp": "Time",
                  "chain": "Chain"
                }
              }
            },
            
            // 交易页面
            "transactionsPage": {
              "title": "Transaction Analysis",
              "description": "Analyze blockchain transactions and identify potential risks",
              "searchPlaceholder": "Enter transaction hash or address...",
              "searchLabel": "Transaction Hash / Address",
              "searchResults": "Search Results",
              "loading": "Searching...",
              "searchFailed": "Search failed",
              "filters": {
                "title": "Filters",
                "startDate": "Start Date",
                "endDate": "End Date",
                "minAmount": "Min Amount",
                "maxAmount": "Max Amount",
                "counterpartyAddress": "Counterparty Address",
                "apply": "Apply Filters",
                "reset": "Reset"
              },
              "details": {
                "title": "Transaction Details",
                "basicInfo": "Basic Information",
                "hash": "Transaction Hash",
                "blockNumber": "Block Number",
                "from": "From",
                "to": "To",
                "value": "Value",
                "timestamp": "Timestamp",
                "riskLevel": "Risk Level",
                "contractInteraction": "Contract Interaction",
                "contractAddress": "Contract Address",
                "methodName": "Method Name",
                "parameters": "Parameters",
                "decodedLogs": "Decoded Logs",
                "noContractInteraction": "This transaction does not interact with any smart contract",
                "close": "Close"
              }
            },
            
            // 地址页面
            "addressesPage": {
              "title": "Address Profile",
              "description": "Build address behavior profile and track historical activity patterns",
              "searchPlaceholder": "Enter blockchain address...",
              "searchLabel": "Address",
              "loading": "Loading address information...",
              "notFound": "Address not found",
              "overview": {
                "title": "Address Overview",
                "balance": "Balance",
                "txCount": "Transaction Count",
                "firstSeen": "First Seen",
                "lastSeen": "Last Seen",
                "tags": "Tags"
              },
              "analysis": {
                "title": "Detailed Analysis",
                "riskScore": "Risk Score",
                "riskFactors": "Risk Factors",
                "dappInteractions": "DApp Interactions",
                "topDapps": "Top DApps",
                "noRiskData": "No risk data available for this address",
                "noDappData": "No DApp interaction data available"
              },
              "similar": {
                "title": "Similar Addresses",
                "powered": "Powered",
                "description": "AI-identified addresses with similar behavior patterns",
                "noData": "No similar addresses found",
                "view": "View",
                "showMore": "Show {{count}} more",
                "showLess": "Show less"
              },
              "activity": {
                "title": "Activity History",
                "noData": "No activity data available"
              },
              "related": {
                "title": "Related Addresses",
                "address": "Address",
                "txCount": "Tx Count",
                "lastInteraction": "Last Interaction"
              },
              "transactions": {
                "title": "Recent Transactions",
                "hash": "Transaction Hash",
                "type": "Type",
                "counterparty": "Counterparty",
                "amount": "Amount",
                "time": "Time",
                "inbound": "Inbound",
                "outbound": "Outbound"
              }
            }
          }
        },
        zh: {
          translation: {
            // 通用
            "welcome": "欢迎使用链智能AI",
            "dashboard_nav": "仪表盘",
            "transactions_nav": "交易",
            "addresses_nav": "地址",
            "analytics": "分析",
            "settings": "设置",
            
            // 全局搜索
            "globalSearch": {
              "placeholder": "搜索地址或交易哈希...",
              "label": "搜索",
              "noResults": "未找到结果",
              "searching": "正在搜索..."
            },
            
            // 风险等级
            "riskLevels": {
              "low": "低风险",
              "medium": "中风险",
              "high": "高风险",
              "critical": "严重风险",
              "unknown": "未知风险"
            },
            
            // 仪表盘页面
            "dashboardPage": {
              "title": "仪表盘",
              "subtitle": "监控区块链活动和风险预警",
              "stats": {
                "todayTransactions": "今日交易",
                "highRiskAlerts": "高风险预警",
                "avgProcessingTime": "平均处理时间",
                "monitoredAddresses": "监控地址数"
              },
              "charts": {
                "riskDistribution": "风险分布",
                "chainDistribution": "链分布",
                "riskTrend": "风险趋势",
                "noData": "暂无数据",
                "checkBack": "请稍后再查看",
                "7days": "7 天",
                "30days": "30 天",
                "90days": "90 天"
              },
              "alerts": {
                "title": "最近预警",
                "viewAll": "查看全部",
                "noAlerts": "暂无预警",
                "allClear": "所有系统运行正常",
                "showMore": "显示更多",
                "showLess": "显示更少",
                "investigate": "调查",
                "types": {
                  "suspicious-transaction": "可疑交易",
                  "blacklist-address": "黑名单地址",
                  "unusual-activity": "异常活动"
                },
                "details": {
                  "address": "地址",
                  "transaction": "交易",
                  "amount": "金额",
                  "timestamp": "时间",
                  "chain": "区块链"
                }
              }
            },
            
            // 交易页面
            "transactionsPage": {
              "title": "交易分析",
              "description": "深入分析区块链交易，识别潜在风险",
              "searchPlaceholder": "输入交易哈希或地址...",
              "searchLabel": "交易哈希 / 地址",
              "searchResults": "搜索结果",
              "loading": "正在搜索...",
              "searchFailed": "搜索失败",
              "filters": {
                "title": "筛选条件",
                "startDate": "开始日期",
                "endDate": "结束日期",
                "minAmount": "最小金额",
                "maxAmount": "最大金额",
                "counterpartyAddress": "交易对手地址",
                "apply": "应用筛选",
                "reset": "重置"
              },
              "details": {
                "title": "交易详情",
                "basicInfo": "基本信息",
                "hash": "交易哈希",
                "blockNumber": "区块号",
                "from": "发送方",
                "to": "接收方",
                "value": "金额",
                "timestamp": "时间戳",
                "riskLevel": "风险等级",
                "contractInteraction": "合约交互",
                "contractAddress": "合约地址",
                "methodName": "方法名称",
                "parameters": "参数",
                "decodedLogs": "解码日志",
                "noContractInteraction": "此交易未与任何智能合约交互",
                "close": "关闭"
              }
            },
            
            // 地址页面
            "addressesPage": {
              "title": "地址画像",
              "description": "构建地址行为画像，追踪历史活动模式",
              "searchPlaceholder": "输入区块链地址...",
              "searchLabel": "地址",
              "loading": "正在加载地址信息...",
              "notFound": "未找到地址",
              "overview": {
                "title": "地址概览",
                "balance": "余额",
                "txCount": "交易次数",
                "firstSeen": "首次交易",
                "lastSeen": "最近交易",
                "tags": "标签"
              },
              "analysis": {
                "title": "详细分析",
                "riskScore": "风险评分",
                "riskFactors": "风险因素",
                "dappInteractions": "DApp交互",
                "topDapps": "热门DApp",
                "noRiskData": "该地址暂无风险数据",
                "noDappData": "该地址暂无DApp交互数据"
              },
              "similar": {
                "title": "相似地址",
                "powered": "驱动",
                "description": "AI识别的具有相似行为模式的地址",
                "noData": "未找到相似地址",
                "view": "查看",
                "showMore": "显示更多 {{count}} 个",
                "showLess": "显示更少"
              },
              "activity": {
                "title": "活动历史",
                "noData": "暂无活动数据"
              },
              "related": {
                "title": "相关地址",
                "address": "地址",
                "txCount": "交易次数",
                "lastInteraction": "最近交互"
              },
              "transactions": {
                "title": "最近交易",
                "hash": "交易哈希",
                "type": "类型",
                "counterparty": "交易对手",
                "amount": "金额",
                "time": "时间",
                "inbound": "转入",
                "outbound": "转出"
              }
            }
          }
        }
      },
      fallbackLng: 'zh', // 默认语言
      interpolation: {
        escapeValue: false // 不转义HTML
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage']
      }
    });
}

export default i18n; 