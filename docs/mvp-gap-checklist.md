这版 OLU 已经从 Demo 结构走到了 workspace-first 的 MVP 骨架，但距离可上线的 MVP 还差几块关键能力。

## MVP 必须做

1. Integrations 页面
- 需要独立的 connectors / integrations 入口，而不只是 settings 里的状态展示。
- 商户需要看到已连接平台、未连接平台、权限范围、最后同步时间、进入平台任务区的入口。

2. 外部平台任务模型
- 需要把 Shopify / Zendesk / Mixpanel 这类平台抽象成任务系统，而不是只展示 connected / planned。
- 至少要有任务类型、状态、执行人、人机分工、输出结果、失败和待审批状态。

3. 人类员工模型
- 现在 AI 员工已经有 workspace-backed roster，但人类员工还没有成为系统实体。
- 需要成员邀请、岗位/权限、成员列表，以及谁能审批/执行/查看。

4. 统一任务与审批中心
- 需要 workspace 级总控视图，统一承接待审批、进行中任务、异常任务、高风险动作。
- 需要清楚展示谁发起、谁执行、谁卡住、是否需要人工接管。

5. 外部 bridge 最小闭环
- Slack / TG / WhatsApp 不需要同时首发，但至少先做一个最小闭环，建议 Slack first。
- 最小闭环包括连接、通知、简单指令回传、在 OLU 内可追踪外部通道来源、bridge 模式限制说明。

6. 消费者端模板选择机制
- 目前 consumer 端仍然更像一套统一内容消费体验。
- 需要模板选择、模板配置、模板类型持久化，以及至少两个真正区分开的模板。
- 首发建议先做：粉丝社区、卖课程。

## MVP 可降级

1. Temu / SHEIN / Google Play / App Store 可以先做 roadmap 级 connector 卡片和 planned 状态，不一定首发真实接入。
2. TG / WhatsApp 可以后于 Slack。
3. 消费者模板不需要一次做全，先做 2 个模板证明架构成立。
4. 权限系统先控制在 owner / manager / operator / viewer 四级。
5. 高级 sandbox 能力先后置，先做高风险审批和人工接管。

## MVP 先别做

1. 不要一开始承诺所有平台深度自动化。
2. 不要先做复杂组织架构和跨部门流程。
3. 不要继续扩很多 Agent 模板，优先把已有 Agent 接进真实工作流。
4. 不要优先投入大量 consumer 视觉分化，先把模板信息结构做对。

## 建议的 MVP 首发范围

- Consumer：粉丝社区模板、卖课程模板
- Business：Creator Ops、Marketing、Supply Chain
- Team：AI 员工、人类员工、统一任务/审批中心
- Connectors：Shopify、Zendesk、Mixpanel
- External bridge：Slack first

## 一句话判断

当前代码已经具备 business workspace、模块化能力开关、workspace-backed agent roster 和 settings / policy / integration 数据骨架。下一步的核心不是再改概念，而是把模块、连接器、员工、审批推进到可执行工作流层。
