# AI 智能硬件 · 跨场景调研

设计思维课程作业的展示站。内容来自课程工作区：

- **116 项数据源**（13 类）与横向树图
- **五份数据包**：五位成员各一套，结构一致（数据源 / 案例数据 / 案例卡 / 文献 / 观点卡）
- **80 张案例卡**（5 位成员），每张含观察 / 原因 / 启示
- **47 条观点卡**，含场景拆解与设计机会点
- **44 个末级场景**与对应的极端用户分析图
- **60 篇文献**（arXiv，端侧算力 / 可穿戴 / 主动介入 / 隐私安全）

## 结构

```
index.html      页面骨架
style.css       全部样式（页面不写内联样式）
app.js          渲染与交互
data.json       案例、观点、场景、文献数据
assets/
  thumbs/       44 张极端用户分析缩略图
  figures/      数据源树图、场景分类图
  czx/          图片型案例卡（5 页）
```

## 本地预览

`data.json` 通过 fetch 读取，需要用 HTTP 打开，不能直接双击 html：

```powershell
python -m http.server 8123 --directory .
# 打开 http://127.0.0.1:8123/
```

## 发布到 GitHub Pages

仓库已初始化并提交，只差一个远程地址。

```powershell
# 1. 先在 GitHub 新建一个空仓库（不要勾选 README）
git remote add origin https://github.com/<你的用户名>/<仓库名>.git

# 2. 推送
git branch -M main
git push -u origin main
```

3. 仓库 **Settings → Pages → Source** 选 `Deploy from a branch`，分支 `main`，目录 `/ (root)`。
4. 等一两分钟，访问 `https://<你的用户名>.github.io/<仓库名>/`。

站点用相对路径，放在子路径下也能正常显示；已包含 `.nojekyll`，避免 Jekyll 处理静态资源。

## 数据更新

修改 `data.json` 即可，无需重新构建。图片资源放在 `assets/` 对应目录。
