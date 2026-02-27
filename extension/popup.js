// 获取DOM元素
const pageInfo = document.getElementById('pageInfo');
const pageTitle = document.getElementById('pageTitle');
const pageUrl = document.getElementById('pageUrl');
const pageIcon = document.getElementById('pageIcon');
const categoryCircles = document.getElementById('categoryCircles');
const addButton = document.getElementById('addButton');
const messageEl = document.getElementById('message');

// 当前页面信息
let currentPageInfo = null;
let categories = [];
let selectedCategoryId = null;

// 分类颜色映射
const colorClasses = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500'
];

// 获取分类颜色
function getCategoryColor(category, index) {
  if (category.color) {
    // 如果分类有自定义颜色，使用自定义颜色
    const colorMap = {
      'bg-blue-500': 'bg-blue-500',
      'bg-green-500': 'bg-green-500',
      'bg-yellow-500': 'bg-yellow-500',
      'bg-red-500': 'bg-red-500',
      'bg-purple-500': 'bg-purple-500',
      'bg-pink-500': 'bg-pink-500',
      'bg-indigo-500': 'bg-indigo-500',
      'bg-teal-500': 'bg-teal-500',
      'bg-orange-500': 'bg-orange-500',
      'bg-cyan-500': 'bg-cyan-500'
    };

    // 检查是否在映射表中
    if (colorMap[category.color]) {
      return colorMap[category.color];
    }

    // 如果是十六进制颜色，转换为内联样式
    if (category.color.startsWith('#') || category.color.startsWith('rgb')) {
      return category.color; // 返回原始颜色值，后面会用内联样式
    }
  }

  // 默认使用索引对应的颜色
  return colorClasses[index % colorClasses.length];
}

// 加载主题
function loadTheme() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.classList.add('dark');
  }
}

// 显示消息
function showMessage(text, type = 'success') {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 2000);
}

// 获取当前标签页信息
function getCurrentTabInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const tab = tabs[0];
      currentPageInfo = {
        title: tab.title || '未知页面',
        url: tab.url || '',
        favIconUrl: tab.favIconUrl || '',
      };

      pageTitle.textContent = currentPageInfo.title;
      pageUrl.textContent = currentPageInfo.url;

      // 尝试加载网站图标
      if (currentPageInfo.favIconUrl) {
        pageIcon.innerHTML = `<img src="${currentPageInfo.favIconUrl}" class="favicon-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><i class="fa-solid fa-globe" style="display:none;"></i>`;
      }
    }
  });
}

// 获取分类列表
function getCategories() {
  const stored = localStorage.getItem('infinity-categories');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // 确保是数组，并过滤无效分类
      const filtered = parsed.filter((cat) =>
        cat &&
        typeof cat === 'object' &&
        typeof cat.id === 'string' &&
        typeof cat.name === 'string' &&
        cat.id.trim() !== '' &&
        cat.name.trim() !== ''
      );

      console.log('Popup 读取到的分类:', filtered);
      return filtered;
    } catch (error) {
      console.error('解析分类数据失败:', error);
      return [];
    }
  }
  console.warn('未找到分类数据');
  return [];
}

// 渲染分类按钮（圆形样式）
function renderCategoryButtons() {
  // 每次都重新读取，确保获取最新数据
  categories = getCategories();

  console.log('Popup 当前分类数量:', categories.length);
  console.log('Popup 分类列表:', categories.map(c => c.name));

  if (categories.length === 0) {
    categoryCircles.innerHTML = '<div style="color: #9ca3af; font-size: 12px; grid-column: 1 / -1;">暂无分类</div>';
    addButton.disabled = true;
    return;
  }

  categoryCircles.innerHTML = '';
  categories.forEach((cat, index) => {
    const item = document.createElement('div');
    item.className = 'category-circle-item';
    item.dataset.categoryId = cat.id;
    item.title = cat.name; // 添加tooltip显示完整名称

    // 获取分类颜色并转换为实际颜色值
    const colorClass = getCategoryColor(cat, index);
    let bgColor = '';

    // 颜色映射表
    const colorMap = {
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#22c55e',
      'bg-yellow-500': '#eab308',
      'bg-red-500': '#ef4444',
      'bg-purple-500': '#a855f7',
      'bg-pink-500': '#ec4899',
      'bg-indigo-500': '#6366f1',
      'bg-teal-500': '#14b8a6',
      'bg-orange-500': '#f97316',
      'bg-cyan-500': '#06b6d4'
    };

    // 如果是自定义颜色（#或rgb开头）
    if (colorClass.startsWith('#') || colorClass.startsWith('rgb')) {
      bgColor = colorClass;
    } else if (colorMap[colorClass]) {
      bgColor = colorMap[colorClass];
    } else {
      // 默认颜色
      bgColor = '#3b82f6';
    }

    item.innerHTML = `
      <div class="category-circle-icon" style="background-color: ${bgColor};">
        <i class="fa-solid fa-check"></i>
      </div>
      <div class="category-short-name">${cat.name}</div>
    `;

    item.addEventListener('click', () => {
      selectCategory(cat.id);
    });

    categoryCircles.appendChild(item);
  });

  // 默认选中第一个分类
  if (categories.length > 0) {
    selectCategory(categories[0].id);
  }

  addButton.disabled = false;
}

// 选择分类
function selectCategory(categoryId) {
  selectedCategoryId = categoryId;

  // 更新UI状态
  document.querySelectorAll('.category-circle-item').forEach(item => {
    if (item.dataset.categoryId === categoryId) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// 添加快捷方式
function addShortcut() {
  if (!currentPageInfo) {
    showMessage('无法获取页面信息', 'error');
    return;
  }

  if (!selectedCategoryId) {
    showMessage('请选择分类', 'error');
    return;
  }

  // 检查是否是网页分类（只能有一个快捷方式）
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  if (selectedCategory && selectedCategory.type === 'management') {
    const stored = localStorage.getItem('infinity-shortcuts');
    let shortcuts = [];
    if (stored) {
      try {
        shortcuts = JSON.parse(stored);
      } catch (error) {
        console.error('解析快捷方式数据失败:', error);
      }
    }

    const categoryShortcuts = shortcuts.filter(s => s.category === selectedCategoryId);

    if (categoryShortcuts.length > 0) {
      showMessage('网页分类只能有一个标签，请先删除现有标签', 'error');
      return;
    }

    // 继续添加
    performAddShortcut(selectedCategoryId);
  } else {
    performAddShortcut(selectedCategoryId);
  }
}

// 执行添加快捷方式
function performAddShortcut(selectedCategoryId) {
  const stored = localStorage.getItem('infinity-shortcuts');
  let shortcuts = [];
  if (stored) {
    try {
      shortcuts = JSON.parse(stored);
      if (!Array.isArray(shortcuts)) {
        shortcuts = [];
      }
    } catch (error) {
      console.error('解析快捷方式数据失败:', error);
      shortcuts = [];
    }
  }

  // 检查是否已存在相同URL的快捷方式
  const existingShortcut = shortcuts.find(
    s => s.url === currentPageInfo.url && s.category === selectedCategoryId
  );

  if (existingShortcut) {
    showMessage('该快捷方式已存在', 'error');
    return;
  }

  // 创建新快捷方式
  const newShortcut = {
    id: Date.now().toString(),
    title: currentPageInfo.title,
    url: currentPageInfo.url,
    icon: currentPageInfo.favIconUrl || 'fa-globe',
    category: selectedCategoryId,
  };

  // 添加到列表
  shortcuts.push(newShortcut);

  // 保存到 localStorage
  try {
    localStorage.setItem('infinity-shortcuts', JSON.stringify(shortcuts));

    // 显示成功消息并关闭 popup
    showMessage('添加成功！', 'success');

    // 延迟关闭 popup
    setTimeout(() => {
      window.close();
    }, 800);
  } catch (error) {
    console.error('保存失败:', error);
    showMessage('保存失败，请重试', 'error');
  }
}

// 初始化
function init() {
  loadTheme();
  getCurrentTabInfo();
  renderCategoryButtons();

  // 绑定事件
  addButton.addEventListener('click', addShortcut);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
