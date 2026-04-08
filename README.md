# Python Problem Review

## About the Project

This repository contains a collection of Python exercises organized by core topics: dictionaries, lists, strings, sets, tuples, and some linked list examples.

The goal of this project is to gather solutions and notes for simple to intermediate programming problems to strengthen basic Python skills.

---

## Directory Structure

- `dict/` - exercises and examples for dictionaries
- `linked-list/` - simple linked list examples and related exercises
- `list/` - list-based problems and operations
- `sets/` - set exercises
- `str/` - string exercises
- `tuple/` - a single example of tuple manipulation

---

## Folder Contents

### dict/

- `d1.py` - examples of creating dictionaries, accessing keys/values, and using `get()`, `keys()`, and `values()`.
- `d2.py` - frequency counting in lists, swapping dictionary keys and values, and dictionary construction notes.
- `d3.py` - counting characters in a string, merging dictionaries, and removing duplicates from a list.
- `d4.py` - counting character frequency, finding the most frequent element, and checking for uniqueness.
- `d5.py` - a simple example of a car dictionary and retrieving values by key.
- `happeynum.py` - a Happy Number solution using a dictionary to track seen numbers.

### linked-list/

- `list1.py` - a basic `Node` and `Linkedlist` implementation with `append` for adding nodes to the end.
- `list2.py` - a solution for `judgeSquareSum`, checking if a number can be expressed as the sum of two squares.
- `list3.py` - currently empty, available for adding more linked list exercises.

### list/

- `codeforces_list.py` - an example of reading numbers and summing them; includes a runnable version.
- `l1.py` - list problems such as finding even numbers and removing duplicates.
- `l2.py` - demonstrates that `nums2 = nums` shares the same list and `+=` mutates the original list.
- `l3.py` - list exercises including conditional printing, modification, and handling zeros.
- `l4.leetcode.py` - a simple Two Sum problem solution using two pointers.
- `leetcode-twosum.py` - currently empty, but indicates a LeetCode-themed exercise.
- `leetcode.py` - a solution for summing odd-length subarrays.
- `leetcodelist.py` - a simple example counting odd elements in a list.
- `list comprehension.py` - a practical list comprehension example for filtering elements.

### sets/

- `s1.py` - code that replaces a character at a specified position in a string, inspired by a Hackerrank challenge.
- `s2.py` - examples of creating sets, adding items, and updating one set with another.

### str/

- `1.py` - string manipulation functions: counting uppercase letters, replacing spaces, and palindrome checks.
- `2.py` - examples of counting vowels and reversing words in a sentence.
- `3.py` - trimming extra spaces and converting each word to title case.
- `4.py` - additional string utilities for cleaning and formatting text.
- `5.py` - several string tasks: first and last character, reverse string, palindrome check, and word count.

### tuple/

- `t1.py` - a tuple example demonstrating conversion to a list for modification and back to a tuple.

---

## How to Use This Project

1. Open the project folder in an editor like VS Code.
2. Run the file you want to test directly.
3. You can modify the files or add new solutions in any folder.

### Running a Python File

Run from the terminal:

```powershell
python path\to\file.py
```

Example:

```powershell
python dict\happeynum.py
```

---

## Notes and Tips

- Most files contain direct solutions or commented starter code, so read the file first before running it.
- To improve organization, consider refactoring each exercise into functions and testing them with `unittest` or `pytest`.
- Empty files such as `linked-list/list3.py` and `list/leetcode-twosum.py` are ready for new exercises.

---

## Project Improvements

You can enhance this repository by adding:

- test suites for each exercise group
- separate README files for each folder with detailed descriptions
- more structured solutions using functions and classes
- input/output examples for each problem

---

## License

This project is intended for personal review and learning. It may be copied and modified freely for educational use.
