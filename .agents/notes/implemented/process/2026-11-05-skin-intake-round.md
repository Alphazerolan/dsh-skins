# Agent Note: The 2026-11-05 skin intake round

Status: implemented

## Problem

Ten open PRs (#68, #77, #80, #83, #84, #85, #93, #97, #99, and #101) were reviewed against all three content gates—user-visible evidence, third-party character copyright, and multimodal aesthetic evaluation. Three recurring failure patterns defined the round:

- **Evidence chains disconnected from the actual change.** Submissions continued to supply byte-identical captures, consecutive captures taken in the same state, or captures from a stale or shifted view state that prevented verifying whether previously reported defects were fixed.
- **Repeated copyright declaration omissions on character skins from the same author.** Required provenance and liability statements were omitted across multiple character-art submissions rather than resolved once across the author's open PRs.
- **Aesthetic rejections surfacing after mechanical gates passed.** Skins that cleared structural validation and numeric contrast checks still failed visual inspection due to washed-out artwork, translucent surface bleed-through, or foreign overlays in the capture frame.

## Decision

**Merged into `main`:**

- **#68 (`skins/model-dorm` floating-surface token adjustment)**: Converted from the prior `CHANGES_REQUESTED` review to `APPROVED` and merged into `main`. It provided the only closed evidence chain in this round: four `512x376` close-up captures from an identical camera position (floating surface bounded at `112-400,60-280`), a clear and directionally accurate comparison between the official default and the skin (light mode top edge shifting from near `#ECEDEF` to near `#B3A197` warm brown; dark mode shifting from near `#3A3B3D` to near `#BAA091` warm white), and a `skin.css` sha256 in `evidence/README` matching the `HEAD` file.

**Returned with required changes:**

- **#101 (`equation-sea`)**: Primary CI fails at `tests/builtin-skins.spec.ts:114` because the primary action button contrast falls below the `3:1` minimum in both modes—light mode `#3a2a1c` on `#9c3b2a` measures `2.01:1` and dark mode `#e9eef6` on `#8fb6ff` measures `1.75:1`—caused by `skin.css` pairing `label-primary-foreground` (tuned for the paper surface) with `var(--eq-accent)` fills. The submission also omits two required copyright declarations: asset source category and liability assumption.
- **#84 (`pixel-whale`)**: Passes the evidence gate, but the copyright declaration omits four required items (asset source category, character/work/rightsholder attribution, liability assumption, and personal non-commercial use only), and both the PR description and README declare `1680x1000` while the actual image dimensions are `2048x1152`.
- **#99 (`verdandi` `1.0.4`)**: Passes all three content gates, but `main` has already carried version `1.0.4` since `2026-10-09`. Replacing content without advancing the version causes `compareVersions(installed, latest) < 0` at `src/bulk.ts:137` to return `0`, so users with `1.0.4` installed never receive the update; the manifest version must be bumped to `1.0.5`.
- **#97 and #93**: Remain in their previous returned state with prior review items unresolved.

**Vetoed at the aesthetic gate despite clearing mechanical checks:**

- **#77 (`whale-watercolour`)**: The creamy-white scrim introduced this round obscures the illustration under a milky fog that erases local boundaries, and the evidence captures switched to the conversation state, making it impossible to verify whether the landing-page composition defect cited in the previous round was resolved.
- **#80 (`md3`)**: The overall design is acceptable for listing, but the settings floating surface and composer are insufficiently opaque—allowing underlying text to bleed through—and `conversation-light` includes a third-party floating window overlapping the logo, requiring clean recaptures and higher surface opacity.

**Awaiting author action:**

- **#83 (`diy-journal` size reduction)**: Passes all three gates and holds `APPROVED` status, blocked only because its branch is behind `main` and awaits author synchronization (contributor branches are not updated on the author's behalf in this round).
- **#85 (`diy-journal` delegated skin)**: Remains blocked by merge conflicts and three unanswered technical questions.

## Alternatives considered

- **Accepting #101 on green workflow status alone.** Rejected: primary CI fails at `tests/builtin-skins.spec.ts:114` with primary button contrast at `2.01:1` (light) and `1.75:1` (dark) against the `3:1` threshold, and the copyright statement still lacks asset source category and liability assumption.
- **Accepting #77's scrim adjustment because measured contrast numbers improved.** Rejected: numeric contrast gains cannot compensate for a full-canvas milky scrim that destroys illustration legibility, nor can conversation-view screenshots substitute for verifying the previously flagged landing-page framing defect.
- **Updating #83's branch with `main` on the contributor's behalf.** Rejected: per explicit round instruction, maintainer review does not push synchronization commits to contributor branches; the author must sync the branch before merge.

## Consequences

- Only one PR (#68) merges in this round; #83 remains `APPROVED` and ready to merge as soon as the author synchronizes the branch with `main`.
- Mechanical gates (schema validation, contrast assertions, and hash checks) are necessary preconditions rather than sufficient criteria for intake: multimodal aesthetic review acts as the final filter after mechanical checks pass, catching over-scrimming (#77), surface bleed-through, and capture contamination (#80).
- Reviewing #99 surfaced a concrete distribution defect in `src/bulk.ts:137`: because bulk update detection relies on `compareVersions(installed, latest) < 0`, any update PR that reuses the version already on `main` (`1.0.4`) will silently fail to deliver to installed users unless bumped to `1.0.5`.

## 2026-11-05 傍晚第二轮复评（Evening Follow-up Round）

本轮对上午退回后收到作者更新的 PR 及待同步分支做二次核验，覆盖 #77、#80、#83、#84、#85、#101 六项。核验结论：#101 与 #84 通过三道内容门禁并合并入 `main`（提交依次由 `37fa7f3` 前移至 `548ae99`、`1841d5f`）；#77、#80、#85 再次退回并附可核验的修法；#83 因远端分支引用漂移维持待作者处理状态。

**已合并（合并后 `main` 依次前移 `37fa7f3` → `548ae99` → `1841d5f`）：**

- **#101（`equation-sea`）**：作者在 `477c2d2` 修复主操作按钮对比度（`skin.css:62` 亮态 `label-primary-foreground` 改为 `#ffffff`，配 `#9c3b2a` 实测 `6.83:1`；`:126` 暗态改为 `#06080c`，配 `#8fb6ff` 实测 `9.83:1`），将按钮悬停态与 dimmed 态收敛至朱砂同色族（`:72-75`），在 `NOTICE` 补齐「素材类别：AI 生成」与贡献者责任声明，将 `skin.json` 的 `author` 由占位值改为 `Chenjiangwen`，并删除未被引用的 `assets/backdrop-light.jpg`。首次贡献者 fork 的 CI 停在 `action_required`，经维护者批准后两项必需检查通过，以 squash 方式合并。遗留非阻塞项：`preview/{dark,light}.jpg` 与 `evidence` 仍沿用第一版截图，图内文字标「正文对比度 ≥ 6.2:1」，与 `README` 更新后的 `≥11.2:1` 不一致，已在 review 中请作者后续补交重截。
- **#84（`pixel-whale`）**：作者在 `523e07b` 逐条落实六项要求（素材类别标明为 ComfyUI + 开源模型 AI 生成、角色归属为作者自有「鲸鱼娘」线、声明由贡献者承担版权责任、标明仅限个人非商业使用、截图尺寸更正为 `2048×1152`、`README` 补充 GIF 体积表 `5.45 MiB` / `3.10 MiB` / 目录总计 `9.30 MiB`）。由于分支落后于 `main`，本轮按维护者授权对该 PR 执行一次 GitHub `update-branch`（仅追加 merge commit，不重写提交历史），待检查通过后以 squash 方式合并。

**再次退回（附可核修法）：**

- **#77（`whale-watercolour`）**：局部 `980px` scrim 已成立（`patches.css:85-99`，首页截图两侧水彩细节得以保留），但会话态截图同时作为商店封面 `preview/{light,dark}.jpg`，画面混入 `dsh-pet` 桌宠浮窗，气泡压住助手回复正文、立绘遮挡操作栏与底栏；且截图时会话态背景高斯模糊处于开启状态，左右两侧画面列被糊平，无法辨认局部 scrim 边界。此外 `README.zh.md:120` 记录的 preview sha256 仍为旧值，实际文件摘要为 `9592b85b…`（`light` 与 `dark` 逐字节相同这一前提本身成立）。退回要求关闭桌宠并将背景模糊滑杆归零后重新截取，同时同步哈希记录。
- **#80（`md3`）**：`bg-layer-1..4` 与 `specific-input-major` 采用 `calc(0.96 + var(--dsw-skin-scrim) * 0.04)` 一类计算式，默认 `scrim` 为 `0` 时仍保留约 `4%` 透明度，而宿主设置弹窗本身不带 `backdrop-filter`，导致底层正文直接透出；作者在 `patches.css` 中对 `[data-composer-dock]` 覆写 `--dsw-alias-bg-base` 无法恢复输入区底部渐隐，原因在于皮肤中心 `src/client/runtime/backdrop-scene.ts:251-256` 在 `html[data-dsh-backdrop-active]` 作用域下通过 `!important` 将 `[data-composer-seat]` 及其 `::before` 的 `background` 与 `backdrop-filter` 强制置空，因此输入区底部只能改用不依赖该节点的遮挡方式。另 `README.md:81` 仍写有「无背景图、无动画」，与同文件 `78-80` 行刚描述的 20 秒底板视频循环前后矛盾。
- **#85（`diy-journal` delegated skin）**：阻塞退回。PR 描述未提供任何截图证据（无亮暗双态换肤对比、无委托卡片或试穿效果）；分支停留在 `f3a2d5d`，落后 `main` 43 个提交并存在 10 个文件冲突；核心问题在于为接入一个尚未发布至 npm 的插件，越界修改了皮肤中心的委托皮肤契约（新增 `data-dsh-delegated-skin` 与 `selectionMode: explicit`，并令委托皮肤 id 写入 `data-dsh-skin` 从而顶掉旧委托插件），同时放开了以 `github:` 提交哈希作为安装源的限制。已要求作者先将插件发布至 npm，并将契约改动单独拆出讨论，该项属于需维护者裁决的协议级变更。

**待作者处理：**

- **#83（`diy-journal` 体积压缩）**：内容层面已获批准，但作者 fork 上的 `codex/diy-journal-compact` 分支当前指向 `cd8cf1a0`，与 PR 记录的 head `44eb3516` 不一致，调用 GitHub `update-branch` 返回 `422`，无法同步亦无法合并，已留言请作者重新推送以对齐分支引用。

### Alternatives considered

- **为避免合并后其他分支再次落后，暂缓合并 #84。** 否决：仓库分支保护要求 PR head 与 `main` 保持同步，本轮已在维护者授权范围内通过单次 `update-branch` 补齐同步要求，且 #84 的六项整改均已逐条核验完毕，没有理由因外部同步成本继续挂起已达标 PR。
- **在收录 #85 的同时一并接受其对委托皮肤契约与安装源的修改。** 否决：`data-dsh-delegated-skin`、`selectionMode: explicit` 及 `github:` 哈希安装源改写的是皮肤中心面向全部第三方委托插件的公共契约与信任边界，影响范围超出单个皮肤或单个插件收录，不能作为皮肤入库 PR 的附带改动直接合入。

### Consequences

- #101 与 #84 合并后 `dsh-skins` 的 `main` 分支推进至 `1841d5f`，但卫星仓合并本身不会更新商店线上产物；后续需在 `dsh-web` 移动 `satellites/dsh-skins` 的 submodule 钉版并重新构建 `market/dist`，两款皮肤才算正式上架。
- #83 的合入优先级进一步上升：当前 `dsh-web` 执行市场构建时会报 `diy-journal ships without a zip`（现有资产包体积超出 25 MiB 服务资产上限），而 #83 正是将 `diy-journal` 体积压缩 62% 的修复分支，待作者对齐远端分支引用并合入后即可解除该打包限制。
