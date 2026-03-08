# OLU MVP Gap Checklist

这版 OLU 已经从 Demo 结构走到了 workspace-first 的 MVP 骨架，但距离可上线的 MVP 还差几块关键能力。当前代码已经具备双入口架构、business workspace、模块化能力开关、workspace-backed agent roster，以及 settings / policy / integration 的基础数据骨架。下一步的核心不是再改概念，而是把模块、连接器、员工、审批推进到可执行工作流层。

## 1. MVP Scope

### 1.1 首发范围

- Consumer
  - 粉丝社区模板
  - 卖课程模板
- Business
  - Creator Ops
  - Marketing
  - Supply Chain
- Team
  - AI 员工
  - 人类员工
  - 统一任务/审批中心
- Connectors
  - Shopify
  - Zendesk
  - Mixpanel
- External bridge
  - Slack first

### 1.2 可降级项

- Temu / SHEIN / Google Play / App Store 先做 roadmap 级 connector 卡片和 planned 状态
- Telegram / WhatsApp 晚于 Slack
- 消费者模板先做 2 个，不一次做全
- 权限系统先控制在 `owner / manager / operator / viewer`
- 高级 sandbox 能力后置，先做高风险审批和人工接管

### 1.3 先别做

- 不要承诺所有平台深度自动化
- 不要先做复杂组织架构和跨部门流程
- 不要继续扩很多 Agent 模板，优先把已有 Agent 接进真实工作流
- 不要优先投入大量 consumer 视觉分化，先把模板信息结构做对

## 2. MVP Must-Haves

### 2.1 Integrations 页面

- 需要独立的 connectors / integrations 入口，而不只是 settings 里的状态展示
- 商户需要看到：
  - 已连接平台
  - 未连接平台
  - 权限范围
  - 最后同步时间
  - 进入平台任务区的入口

### 2.2 外部平台任务模型

- 需要把 Shopify / Zendesk / Mixpanel 抽象成任务系统，而不是只展示 `connected / planned`
- 至少要有：
  - 任务类型
  - 状态
  - 执行人
  - 人机分工
  - 输出结果
  - 失败和待审批状态

### 2.3 人类员工模型

- 现在 AI 员工已经有 workspace-backed roster，但人类员工还没有成为系统实体
- 需要：
  - 成员邀请
  - 岗位 / 权限
  - 成员列表
  - 谁能审批 / 执行 / 查看

### 2.4 统一任务与审批中心

- 需要 workspace 级总控视图，统一承接：
  - 待审批
  - 进行中任务
  - 异常任务
  - 高风险动作
- 需要清楚展示：
  - 谁发起
  - 谁执行
  - 谁卡住
  - 是否需要人工接管

### 2.5 外部 bridge 最小闭环

- Slack / TG / WhatsApp 不需要同时首发，但至少先做一个最小闭环，建议 Slack first
- 最小闭环包括：
  - 连接
  - 通知
  - 简单指令回传
  - 在 OLU 内可追踪外部通道来源
  - bridge 模式限制说明

### 2.6 消费者端模板选择机制

- 目前 consumer 端仍然更像一套统一内容消费体验
- 需要：
  - 模板选择
  - 模板配置
  - 模板类型持久化
  - 至少两个真正区分开的模板
- 首发建议：
  - 粉丝社区
  - 卖课程

## 3. Page Checklist

### 3.1 Consumer 端页面

#### 必须新增

- Consumer Template Picker
  - 选择 `粉丝社区` 或 `卖课程`
  - 新用户或新 workspace 首次进入 consumer 配置时可见
- Consumer Template Settings
  - 配置模板基础信息
  - 配置模板导航
  - 配置模板主 CTA

#### 首发模板定义

- 粉丝社区模板
  - 适用场景：创作者会员社区、知识陪伴社群、轻内容订阅
  - 核心页面：社区首页、内容详情、会员权益页、话题/圈子页、私信/群聊、个人中心
  - 核心模块：Feed、会员分层、评论互动、社区活动、精华内容、付费解锁
  - 主 CTA：加入社区、开通会员、解锁内容
  - 核心指标：入会转化、活跃度、留存、互动率、付费会员数
- 卖课程模板
  - 适用场景：系统化知识交付、录播课程、训练营/课包
  - 核心页面：课程首页、课程目录、章节播放/学习页、课程介绍页、购买页、学习记录页、个人中心
  - 核心模块：课程卡片、章节结构、学习进度、已购/未购状态、推荐课程、课程 FAQ
  - 主 CTA：购买课程、开始学习、继续学习
  - 核心指标：课程购买转化、开课率、完课率、复购率、客单价

#### 模板差异验收口径

- 首页结构必须不同
  - 粉丝社区首页以动态流、讨论、会员氛围为主
  - 卖课程首页以课程目录、课程价值、学习路径为主
- 主 CTA 必须不同
  - 粉丝社区是加入/订阅/互动
  - 卖课程是购买/开始学习/继续学习
- 内容组织方式必须不同
  - 粉丝社区按动态流和圈子组织
  - 卖课程按课程包、章节、学习进度组织
- 第一版最小闭环必须成立
  - 粉丝社区能完成加入会员
  - 卖课程能完成购买课程并进入学习页

#### 粉丝社区模板页面结构

- 社区首页
  - 页面目标：建立社区氛围并推动用户加入会员
  - 关键模块：置顶介绍、精选动态、话题入口、会员权益摘要、活动区、推荐创作者/圈子
  - 主操作：加入社区、开通会员、进入话题
- 内容详情页
  - 页面目标：承接动态、图文、视频、专栏内容消费
  - 关键模块：内容正文、评论区、互动区、相关推荐、解锁提示
  - 主操作：点赞、评论、收藏、解锁
- 会员权益页
  - 页面目标：解释不同会员层级的价值并完成转化
  - 关键模块：权益对比、价格卡片、常见问题、会员说明
  - 主操作：开通会员、升级会员
- 话题 / 圈子页
  - 页面目标：承接社群讨论和兴趣沉淀
  - 关键模块：话题列表、圈子介绍、热门讨论、管理员置顶
  - 主操作：进入圈子、参与讨论、发帖
- 私信 / 群聊页
  - 页面目标：增强成员互动与陪伴感
  - 关键模块：会话列表、消息流、群组入口、未读提醒
  - 主操作：发消息、进入群组
- 个人中心
  - 页面目标：查看会员状态和互动记录
  - 关键模块：会员状态、已解锁内容、互动记录、账户设置
  - 主操作：续费会员、查看已加入圈子

#### 卖课程模板页面结构

- 课程首页
  - 页面目标：展示课程价值并推动购买
  - 关键模块：课程 banner、课程卖点、讲师介绍、推荐课程、FAQ
  - 主操作：购买课程、查看目录
- 课程目录页
  - 页面目标：展示课程结构和章节安排
  - 关键模块：章节树、试看章节、课时信息、更新说明
  - 主操作：开始学习、解锁课程
- 章节播放 / 学习页
  - 页面目标：承接具体学习行为
  - 关键模块：视频/音频/图文内容、章节导航、学习进度、作业/资料下载
  - 主操作：播放、切换章节、标记完成、继续学习
- 课程介绍页
  - 页面目标：详细解释课程适合谁、能学到什么
  - 关键模块：课程收益、适合人群、课程安排、讲师介绍、用户评价
  - 主操作：购买课程
- 购买页
  - 页面目标：完成交易
  - 关键模块：课程摘要、价格、优惠、支付方式、退款说明
  - 主操作：下单支付
- 学习记录页
  - 页面目标：让用户回到自己的学习上下文
  - 关键模块：已购课程、学习进度、最近学习、待完成章节
  - 主操作：继续学习、进入课程
- 个人中心
  - 页面目标：管理已购课程和账号信息
  - 关键模块：订单、课程资产、学习记录、账户设置
  - 主操作：查看订单、进入已购课程

#### 粉丝社区模板导航与路由建议

- 底部导航建议
  - 首页
  - 话题
  - 消息
  - 我的
- 一级路由建议
  - `/`
    - 社区首页
  - `/topics`
    - 话题 / 圈子列表
  - `/topics/:topicId`
    - 话题详情 / 圈子详情
  - `/post/:postId`
    - 内容详情
  - `/membership`
    - 会员权益页
  - `/chat`
    - 私信 / 群聊
  - `/profile`
    - 个人中心
- 首页模块顺序建议
  - 社区头图 / 创作者介绍
  - 会员 CTA
  - 精选动态
  - 热门话题
  - 社区活动
- 导航原则
  - 强调持续互动与社群感
  - 话题入口优先级高
  - 会员转化入口必须常驻

#### 卖课程模板导航与路由建议

- 底部导航建议
  - 课程
  - 学习
  - 消息
  - 我的
- 一级路由建议
  - `/`
    - 课程首页
  - `/courses`
    - 课程列表 / 课程目录入口
  - `/courses/:courseId`
    - 课程介绍页
  - `/courses/:courseId/catalog`
    - 课程目录页
  - `/learn/:courseId/:sectionId`
    - 章节播放 / 学习页
  - `/checkout/:courseId`
    - 购买页
  - `/learning`
    - 学习记录页
  - `/profile`
    - 个人中心
- 首页模块顺序建议
  - 课程 banner / 主打课程
  - 课程卖点
  - 热门课程
  - 学习路径
  - 讲师介绍
- 导航原则
  - 强调购买与学习路径
  - 学习记录必须是一级入口
  - 章节学习页必须支持连续学习和返回目录

#### 模板路由层实现建议

- 不建议一开始完全拆成两套前端应用
- 第一版建议保留统一 consumer app，但增加 `consumer_template_key`
- 由模板 key 控制：
  - 底部导航配置
  - 首页区块配置
  - 详情页组件结构
  - 关键 CTA 文案
- 路由实现建议
  - 共享公共路由：`/profile`、`/chat`
  - 社区模板优先支持：`/topics`、`/membership`、`/post/:id`
  - 课程模板优先支持：`/courses`、`/learn/:courseId/:sectionId`、`/checkout/:courseId`
- 第一版不要追求所有页面完全隔离
  - 先做到导航和页面结构显著不同
  - 再逐步把模板抽成独立 route config

#### 模板导航验收口径

- 用户进入两个模板时，底部导航不能一样
- 两个模板首页的首屏模块顺序不能一样
- 社区模板必须存在 `会员权益页` 或等价转化入口
- 课程模板必须存在 `学习记录页` 和 `学习页`
- 用户从首页到关键闭环的点击路径必须清晰
  - 社区模板：首页 -> 会员页 -> 开通会员
  - 课程模板：首页 -> 课程介绍 -> 购买页 -> 学习页

#### 必须改造

- Home
  - 支持按模板切换内容块，而不是一套固定 feed
- Profile / Creator Profile
  - 模板相关字段透出
- Shop
  - 对课程模板要支持课程目录 / 章节入口，而不只是商品陈列

### 3.2 Business 端页面

#### 必须新增

- `/business/integrations`
  - 集中管理连接器
- `/business/tasks`
  - 统一任务中心
- `/business/approvals`
  - 统一审批中心
- `/business/team/members`
  - 人类员工列表、邀请、角色管理

#### 必须改造

- `/business`
  - 继续作为 workspace overview，但要接真实任务和审批摘要
- `/business/settings`
  - 从“展示连接状态”升级为“进入 integrations 和 policy 配置的系统入口”
- `/business/team`
  - 不能只显示 AI roster，需要加入 human members 和 mixed team 视图
- `/business/agents`
  - 不能只停留在 hire marketplace，要能看到 agent coverage、任务来源、平台权限

### 3.3 External Bridge 页面

#### 必须新增

- `/business/bridges`
  - 首发只接 Slack 也可以
  - 展示 bridge 状态、channel、可用能力、限制说明

## 4. Data Model Checklist

### 4.1 现有可复用

- `workspaces`
- `workspace_memberships`
- `workspace_modules`
- `workspace_permissions`
- `workspace_integrations`
- `workspace_policies`
- `workspace_agents`
- `workspace_agent_tasks`
- `business_campaigns`
- `business_campaign_targets`
- `business_campaign_events`

### 4.2 必须新增或补强

#### consumer template

- `consumer_templates`
  - `id`
  - `template_key`
  - `name`
  - `status`
- `workspace_consumer_configs`
  - `workspace_id`
  - `template_key`
  - `settings_json`
  - `published`
- `membership_tiers`
  - 支持粉丝社区模板的会员分层与权益
- `courses`
  - 支持卖课程模板的课程卡片与课程详情
- `course_sections`
  - 支持章节目录和学习结构
- `purchases`
  - 记录课程购买状态
- `learning_progress`
  - 记录学习进度与继续学习入口

#### human employees

- `workspace_members`
  - 如果继续复用 `workspace_memberships`，需要补足展示层字段
  - `title`
  - `department`
  - `status`
- `workspace_member_permissions`
  - 如权限不继续全挂在 membership role，需要细粒度资源授权

#### unified tasks

- `workspace_tasks`
  - `id`
  - `workspace_id`
  - `source_type`，如 `platform / bridge / module / manual`
  - `source_ref`
  - `task_type`
  - `title`
  - `status`
  - `priority`
  - `assignee_type`，如 `human / agent / unassigned`
  - `assignee_id`
  - `requires_approval`
  - `result_json`
  - `error_json`

#### approvals

- `workspace_approvals`
  - `workspace_id`
  - `approval_type`
  - `resource_type`
  - `resource_id`
  - `requested_by_type`
  - `requested_by_id`
  - `reviewer_id`
  - `status`
  - `decision_note`

#### bridge

- `workspace_bridges`
  - `workspace_id`
  - `provider`
  - `status`
  - `config_json`
  - `last_sync_at`
- `bridge_events`
  - `bridge_id`
  - `external_thread_id`
  - `direction`
  - `event_type`
  - `payload_json`
  - `workspace_task_id`

#### integration task coverage

- `integration_task_templates`
  - `provider`
  - `task_type`
  - `risk_level`
  - `requires_approval`
  - `enabled`

## 5. API / Service Checklist

### 5.1 Integrations

- `getWorkspaceIntegrations`
- `connectWorkspaceIntegration`
- `disconnectWorkspaceIntegration`
- `syncWorkspaceIntegration`
- `getIntegrationTaskTemplates`

### 5.2 Team / Members

- `inviteWorkspaceMember`
- `listWorkspaceMembers`
- `updateWorkspaceMemberRole`
- `deactivateWorkspaceMember`

### 5.3 Tasks / Approvals

- `listWorkspaceTasks`
- `createWorkspaceTask`
- `assignWorkspaceTask`
- `advanceWorkspaceTask`
- `listWorkspaceApprovals`
- `approveWorkspaceItem`
- `rejectWorkspaceItem`

### 5.4 Bridge

- `connectWorkspaceBridge`
- `listWorkspaceBridges`
- `receiveBridgeEvent`
- `sendBridgeNotification`

### 5.5 Consumer template

- `listConsumerTemplates`
- `getWorkspaceConsumerConfig`
- `updateWorkspaceConsumerConfig`
- `publishWorkspaceConsumerConfig`

## 6. Core Workflow Checklist

### 6.1 Shopify 运营任务

1. 商户连接 Shopify
2. 系统出现 Shopify 任务模板
3. 商户创建或触发 Shopify 运营任务
4. 任务分配给 AI 或人类员工
5. 高风险动作进入审批
6. 执行结果回写到 workspace task result

### 6.2 Zendesk 客服任务

1. 商户连接 Zendesk
2. 新 ticket 进入 workspace task
3. AI 先处理低风险回复建议
4. 人类员工 review 或接管
5. 最终处理结果在 OLU 内可追踪

### 6.3 Mixpanel 数据分析任务

1. 商户连接 Mixpanel
2. 触发分析任务
3. Data Analyst agent 输出结论
4. 输出进入任务结果与 workspace 摘要

### 6.4 Slack bridge

1. 商户连接 Slack
2. OLU 向指定 channel 推送任务 / 审批通知
3. 用户在 Slack 内做简单反馈或确认
4. OLU 记录 bridge event 并映射回 task / approval
5. 若超出 bridge 能力边界，提示回到 OLU workspace 完成操作

### 6.5 Consumer 模板初始化

1. 商户选择模板
2. 保存模板配置
3. consumer 端按模板渲染不同导航和页面块
4. business 端仍保持统一 workspace 管理

## 7. State Machines

### 7.1 workspace task

- `draft`
- `queued`
- `in_progress`
- `waiting_for_approval`
- `blocked`
- `completed`
- `failed`
- `cancelled`

### 7.2 approval

- `pending`
- `approved`
- `rejected`
- `expired`
- `cancelled`

### 7.3 integration

- `planned`
- `connecting`
- `connected`
- `syncing`
- `error`
- `disconnected`

### 7.4 bridge

- `planned`
- `connected`
- `limited`
- `error`
- `disabled`

## 8. Acceptance Criteria

### 8.1 Business workspace

- 商户可以在一个 workspace 内同时启用 `Creator Ops / Marketing / Supply Chain`
- 侧边栏无需角色切换即可访问已启用模块

### 8.2 Mixed workforce

- team 页面同时能看到人类员工和 AI 员工
- 至少一种任务可以在人类和 AI 之间分配、转交、接管

### 8.3 Connectors

- Shopify、Zendesk、Mixpanel 至少 3 个 connector 有真实连接状态和任务入口
- 至少 2 个平台具备真实任务闭环

### 8.4 Bridge

- Slack 可连接
- Slack 通知可回流到 OLU
- 用户能明确看到 bridge 模式限制

### 8.5 Consumer templates

- 至少 2 个模板可切换
- 两个模板在导航、内容结构或关键 CTA 上有真实差异

## 9. Suggested Build Order

1. 统一任务中心 + 统一审批中心
2. 人类员工模型
3. Integrations 页面
4. Shopify / Zendesk / Mixpanel 任务模板
5. Slack bridge 最小闭环
6. Consumer 模板选择与 2 个模板首发
