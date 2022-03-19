// 响应式函数
function defineReactive(obj, key, val) {

  // val是个对象的话 需要我们去递归处理
  observe(val);

  // 创建Dep实例
  const dep = new Dep();

  Object.defineProperty(obj, key, {
    get() {
      // 依赖关系收集
      Dep.target && dep.addDep(Dep.target);
      return val;
    },
    set(v) {
      if (v !== val) {
        val = v;
        // 如果我们响应式的新值也是对象的话,也需要我们递归遍历处理
        observe(v);

        // 数据发生变化由Dep通知watcher更新dom
        dep.notify();
      }
    }
  })
}

// 遍历响应式处理
function observe(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  new Observer(obj);
}


// 将传入对象中的所有key代理到指定对象上
function proxy(vm) {
  Object.keys(vm._data).forEach((key) => {
    Object.defineProperty(vm, key, {
      get() {
        return vm._data[key];
      },
      set(v) {
        vm._data[key] = v;
      }
    })
  })
}


class Observer {
  constructor(obj) {
    if (Array.isArray(obj)) {
      // todo
    } else {
      this.walk(obj);
    }
  }

  // 对象属性进行响应式拦截
  walk(obj) {
    Object.keys(obj).forEach((key) => defineReactive(obj, key, obj[key]));
  }
}


class Zvue {
  constructor(options) {
    // 1、保存选项
    this._options = options;
    this._data = options.data;

    // 2、做响应式处理
    observe(options.data);

    // 3、将data代理Zvue实例上
    proxy(this);

    // 4、编译
    new Compile(options.el, this);

  }
}


class Compile {
  constructor(el, vm) {
    this._vm = vm;
    this._el = document.querySelector(el);

    if (this._el) {
      this.compile(this._el);
    }
  }

  // el, 判断节点类型
  compile(el) {
    const childNodes = el.childNodes;
    childNodes.forEach((n) => {
      //判断类型
      if (this.isElement(n)) {
        // 如果是元素
        this.compileElement(n);

        // 递归遍历子节点
        if (n.childNodes && n.childNodes.length > 0) {
          this.compile(n)
        }
      } else if (this.isInter(n)) {
        // 如果是插值文本
        this.compileText(n);
      }
    })
  }

  isElement(n) {
    return n.nodeType === 1;
  }

  isInter(n) {
    return n.nodeType === 3 && /\{\{(.*)\}\}/.test(n.textContent);
  }

  isDir(attr) {
    return attr.startsWith('z-');
  }

  // 编译插值文本 {{ooxx}}
  compileText(n) {
    // 获取表达式
    this.update(n, RegExp.$1, "text");
  }

  // 处理元素
  compileElement(node) {
    Array.from(node.attributes).forEach((attr) => {
      const attrName = attr.name;
      const exp = attr.value;

      // 判断是否是一个指令
      if (this.isDir(attrName)) {
        const dir = attrName.substring(2);
        this[dir] && this[dir](node, exp);
      }
    })
  }

  update(node, exp, dir) {
    // 初始化更新
    const fn = this[dir + 'Updater'];
    fn && fn(node, this._vm[exp]);

    // 更新watcher
    new Watcher(this._vm, exp, val => {
      fn && fn(node, val);
    })
  }

  //z-text
  text(node, exp) {
    this.update(node, exp, "text");
  }

  textUpdater(node, val) {
    node.textContent = val;
  }
}

// 负责dom更新
class Watcher {
  constructor(vm, key, updater) {
    this._vm = vm;
    this._key = key;
    this._updater = updater;

    // 触发一下get
    Dep.target = this;
    this._vm[this._key];
    Dep.target = null;
  }


  // 将来会被Dep调用
  update() {
    this._updater.call(this._vm, this._vm[this._key]);
  }
}


// 保存watcher实例的依赖类
class Dep {
  constructor() {
    this.deps = []
  }

  // wat就是Watcher的实例
  addDep(wat) {
    this.deps.push(wat)
  }

  // 通知更新
  notify() {
    console.log(this.deps)
    this.deps.forEach(wat => wat.update())
  }
}