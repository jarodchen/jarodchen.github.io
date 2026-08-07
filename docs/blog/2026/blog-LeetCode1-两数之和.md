---
tags: [LeetCode, 算法, 数组, 哈希表, 刷题笔记]
category: 算法
categories: [LeetCode]
title: LeetCode 1：两数之和 —— 从暴力到哈希，一个经典问题的优雅蜕变
date: 2026-08-07T11:02:00
banner: /images/algo.webp
description: 从最直观的暴力解法到巧妙的哈希表优化，带你深度剖析 LeetCode 第一题“两数之和”，掌握高效解题的思维脉络。
---
# LeetCode 1：两数之和 —— 从暴力到哈希，一个经典问题的优雅蜕变

几乎每一个开始刷 LeetCode 的人，都会在“两数之和”这道题上留下自己的足迹。它不仅是算法的入门基石，更是一面镜子，照出我们从“能解”到“会解”的成长轨迹。

题目很简单：给定一个整数数组和一个目标值，找出数组中两个数，使它们的和等于目标值，并返回它们的下标。但就是这道看似平平无奇的题目，藏着算法优化的核心思想 —— 用空间换时间。

今天，我就带你从最直观的暴力解法开始，一步步走向更优雅的哈希表解法，并在这个过程中，体会算法思维的魅力。

## 题目速览

> 给定一个整数数组 `nums` 和一个整数目标值 `target`，请你在该数组中找出和为目标值 `target` 的那两个整数，并返回它们的数组下标。
>
> 你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。
> 你可以按任意顺序返回答案。

**示例**：
- 输入：`nums = [2,7,11,15]`, `target = 9` → 输出：`[0,1]`（因为 2+7=9）
- 输入：`nums = [3,2,4]`, `target = 6` → 输出：`[1,2]`（2+4=6）
- 输入：`nums = [3,3]`, `target = 6` → 输出：`[0,1]`

**约束**：数组长度 2~10^4，数值范围 ±10^9，且保证有且仅有一个有效答案。

## 方法一：暴力枚举 —— 直觉的起点

面对这个问题，最本能的反应是什么？当然是遍历所有可能的两数组合，看看哪一对加起来等于目标值。这就像在一堆拼图中，一块块地尝试配对。

### 思路

用两层循环：
- 外层固定一个数 `nums[i]`；
- 内层从 `i+1` 开始往后找，看 `nums[i] + nums[j]` 是否等于 `target`。

一旦找到，立即返回下标。

### 代码示例（C#）

```csharp
public class Solution {
    public int[] TwoSum(int[] nums, int target) {
        for (int i = 0; i < nums.Length - 1; i++) {
            for (int j = i + 1; j < nums.Length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[] { i, j };
                }
            }
        }
        return new int[] { };
    }
}
```
###  代码示例 （JavaScript）

```javascript
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // 外层循环遍历数组中的每个元素
    for (let i = 0; i < nums.length - 1; i++) {
        // 内层循环查找是否存在与当前元素配对的另一个元素
        for (let j = i + 1; j < nums.length; j++) {
            // 如果找到满足条件的两个元素，返回它们的索引
            if (nums[i] + nums[j] === target) {
                return [i, j];
            }
        }
    }
    // 如果没有找到满足条件的两个元素，返回空数组（题目保证有解，这里只是为了语法正确）
    return [];
};
```

### 复杂度分析

- **时间复杂度**：O(n²) —— 最坏情况下，每两个数都要比较一次。
- **空间复杂度**：O(1) —— 只用了常数级额外空间。

暴力法虽然直接，但当数组长度达到 10^4 时，千万级别的比较会让程序明显变慢。那么，有没有更快的方法？

## 方法二：哈希表 —— 空间换时间的优雅转身

暴力法的瓶颈在于内层循环 —— 为了找到 `target - nums[i]`，我们不得不遍历剩余的所有元素。如果我们能“记住”已经遍历过的元素，并在 O(1) 时间内查询它们是否存在，那该多好？

这正是哈希表（HashMap）的用武之地。

### 核心思想

我们遍历数组一次，对于当前元素 `nums[i]`：
1. 计算 `complement = target - nums[i]`；
2. 在哈希表中查找 `complement`：
   - 如果存在，说明之前已经遇到过这个“配对数字”，直接返回它的索引和当前索引；
   - 如果不存在，就把 `nums[i]` 和它的索引存入哈希表，供后续元素使用。

这样，我们只遍历了一次数组，且每次查找都是近似 O(1) 的。

### 代码示例（C#）

```csharp
public class Solution {
    public int[] TwoSum(int[] nums, int target) {
        Dictionary<int, int> hashtable = new Dictionary<int, int>();
        for (int i = 0; i < nums.Length; i++) {
            int complement = target - nums[i];
            if (hashtable.ContainsKey(complement)) {
                return new int[] { hashtable[complement], i };
            }
            hashtable[nums[i]] = i;
        }
        return new int[] { };
    }
}
```
###  代码示例 （JavaScript）

```javascript
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // 创建一个哈希表，用于存储已遍历元素的值和索引
    const hashtable = new Map();
    
    // 遍历数组中的每个元素
    for (let i = 0; i < nums.length; i++) {
        // 计算当前元素对应的目标元素
        const complement = target - nums[i];
        
        // 检查目标元素是否已经在哈希表中
        if (hashtable.has(complement)) {
            // 如果存在，则返回两个元素的索引
            return [hashtable.get(complement), i];
        }
        
        // 将当前元素和索引存入哈希表
        hashtable.set(nums[i], i);
    }
    
    // 如果没有找到满足条件的两个元素，返回空数组（题目保证有解，这里只是为了语法正确）
    return [];
};
```

（其他主流语言如 Python、Java、Go 的实现思路完全一致，只是语法不同。）

### 复杂度分析

- **时间复杂度**：O(n) —— 只遍历一次，哈希表操作 O(1)。
- **空间复杂度**：O(n) —— 哈希表最多存储 n 个元素。

从 O(n²) 到 O(n)，这是质的飞跃。而代价仅仅是额外开辟了一个哈希表 —— 空间换时间，在算法中屡试不爽。

## 思考与延伸

### 为什么哈希表能行？

哈希表本质上是“以键值对存储的字典”。在这个问题中，键是数组元素的值，值是该元素的下标。当我们遍历到某个元素时，我们想知道的是“之前是否出现过某个特定值”，而哈希表恰好能快速回答这个问题。

### 如果数组有序呢？

如果数组已经排好序，我们还可以用“双指针”法，从两端向中间逼近，时间复杂度同样是 O(n)，但空间可以降到 O(1)。不过本题未保证有序，所以哈希表是更通用的方案。

### 进阶挑战

这道题看似简单，但它是一系列“N 数之和”问题的基石。你可以接着挑战：
- [15. 三数之和](https://leetcode.cn/problems/3sum/) —— 从两数到三数，如何避免重复？
- [18. 四数之和](https://leetcode.cn/problems/4sum/) —— 层层嵌套还是另辟蹊径？
- [167. 两数之和 II - 输入有序数组](https://leetcode.cn/problems/two-sum-ii-input-array-is-sorted/) —— 有序情况下双指针妙用。

## 给你的一点启发

刷题从来不是为了记住代码，而是为了训练思维。当你遇到一个新问题时，不妨先问自己：
- 暴力解法是什么？它的瓶颈在哪？
- 有没有数据结构能帮我消除这个瓶颈？
- 如果我愿意多花一点内存，能否换来时间的大幅降低？

“两数之和”的哈希表解法，就是这一思维模式的绝佳范例。它告诉我们：有时候，往前走一步（遍历），回头看一眼（查找已走过的路），就能让问题迎刃而解。

下次再看到类似“在集合中寻找配对”的问题时，希望你能第一时间想到哈希表 —— 这个老朋友会一直陪伴你的算法之旅。

## 行动建议

1. **亲手写一遍**：用你熟悉的语言实现哈希表解法，感受它的简洁与高效。
2. **对比两种解法的运行时间**：在 LeetCode 上提交，观察 O(n²) 和 O(n) 的差异，尤其是在大数据量下。
3. **尝试变体**：如果要求返回元素值而不是下标，代码怎么改？如果存在多个解，又要怎么处理？
4. **延伸学习**：研究一下 `Dictionary`/`HashMap` 的底层实现（哈希碰撞、扩容等），你会对 O(1) 有更深的理解。

算法之路，道阻且长，但每解开一道经典题，你都会离高手更近一步。两数之和，只是开始。加油！
