---
title: 我的三个 DSH 开源插件
description: 介绍了为 DeepSeek Harness 写的三个开源插件：驱动 Photoshop、自动做 Cisco 实训、中文思考翻译，以及为什么坚持不用截图 OCR。
date: 2026-11-23
tags: [技术, 开源]
---

最近把自己为 DeepSeek Harness（下称 DSH）写的三个插件开源了。DSH 是一个本地 AI 代理框架，插件就是给它扩展"手"和"眼"。三个插件共通的设计原则是：**不使用截图、OCR 或键鼠模拟，只走官方编程接口**——稳定、可验证、不会抢用户的鼠标。

## 1. dsh-ps-automation：让 AI 直接驱动 Photoshop

仓库：[dsh-ps-automation](https://github.com/filek-mu/dsh-ps-automation)

通过 Photoshop 2020+ 的原生 ExtendScript（`.jsx`）和 UXP 接口操作图像，而不是模拟鼠标点击。能做的事包括：

- 文档生命周期：新建、打开、改尺寸、改色彩模式、保存、关闭
- 图层操作：列表、可见性、合并、排序、重命名
- 像素级编辑：裁剪、色阶、曲线、锐化、水印、边框
- 批处理：整个文件夹按同一套计划处理，处理前自动备份
- 操作日志：每次任务都有带序号的 journal，出问题可以查

自己用过最爽的场景是批量修图：一份图片清单发给 AI，它按计划逐张处理并汇报每张的前后变化。

## 2. dsh-cisco-pt-agent：自动做 Cisco Packet Tracer 实训

仓库：[dsh-cisco-pt-agent](https://github.com/filek-mu/dsh-cisco-pt-agent)

面向计算机网络课程场景：用可编程的拓扑模型构建、配置、验证并导出 Packet Tracer 工程。交互只通过 Packet Tracer 自己的 JavaScript 扩展 API，不走截图 OCR。能做：

- 按需求自动搭拓扑
- 生成并下发 IOS 配置
- 模拟 CLI 会话、验证连通性
- 自动生成实训报告

对经常要做 PT 实验的人来说，这相当于把"拖设备、敲命令、检查连通"的重复劳动交给了程序。

## 3. dsh-thinking-zh：把模型思考内容翻译成中文

仓库：[filek-mu/dsh-thinking-zh](https://github.com/filek-mu/dsh-thinking-zh)

DSH 对话里模型的思考过程默认是英文，这个插件把展开的思考内容自动翻译成简体中文（走 Bing），原文保留，随时可切回。功能很小，但每天读思考内容的人会一直感谢它。

## 为什么坚持"不截图、不 OCR"

基于截图 + OCR 的方案有三个老毛病：脆（界面一变就失效）、慢（截图往返耗时）、危险（会真的抢走鼠标键盘）。而官方 API 方案让 AI 的每一步操作都是明确的结构化指令，能校验、能重放、能写进日志。三个插件都是这个思路的实践。

## 后续

三个插件都以 MIT 或仓库内声明的协议开源，装法在各自 README 里。之后打算写几篇细节拆解：PS 插件的 journal 设计、PT 插件的拓扑模型、翻译插件的缓存策略。
