// https://eslint.org/docs/user-guide/configuring

module.exports = {
    root: true,
    parserOptions: {
        parser: '@typescript-eslint/parser'
    },
    env: {
        browser: true,
        commonjs: true,
        es6: true
    },
    extends: [
        // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
        // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
        'plugin:vue/essential',
        // https://github.com/standard/standard/blob/master/docs/RULES-en.md
        'standard'
    ],
    // required to lint *.vue files
    plugins: [
        'vue'
    ],
    // add your custom rules here
    rules: {
        // allow async-await
        'generator-star-spacing': 'off',
        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        // 使用缩进为4
        indent: [0, 4],
        // 不允许使用alert
        'no-alert': 0,
        // 不允许使用var，改用let或者const
        'no-var': 2,
        // 强制使用驼峰命名法
        camelcase: 0,
        semi: 0,
        // 引号类型
        quotes: 0, // 引号类型 `` "" '',
        // 不检查注释的前后空格
        'spaced-comment': 0,
        // 控制逗号前后的空格
        'comma-spacing': 0,
        'space-before-function-paren': [0, 'always'],
        'no-trailing-spaces': [0, { skipBlankLines: true }],
        // 不检查结尾处的换行
        'eol-last': 0,
        // 禁用必须使用全等
        eqeqeq: 0,
        // 禁用大括号风格
        'brace-style': 0,
        // 空行最多不能超过100行
        'no-multiple-empty-lines': [0, { max: 100 }],
        'promise/param-names': 0,
        'prefer-promise-reject-errors': 0,
        curly: 0,
        // 函数名首行大写必须使用new方式调用，首行小写必须用不带new方式调用
        'new-cap': 0,
        'block-spacing': 0,
        'no-useless-escape': 0,
        'no-irregular-whitespace': 0,
        // 不能用多余的空格
        'no-multi-spaces': 'off',
        // 换行时运算符在行尾还是行首
        'operator-linebreak': 0,
        // 允许声明未使用变量
        'no-unused-vars': 1,
        'no-tabs': 0,
        // 禁止在块语句中使用声明（变量或函数）
        'no-inner-declarations': 0,
        // 禁止使用eval
        'no-eval': 0,
        'no-new': 0,
        'import/first': 0,
        'no-template-curly-in-string': 0,
        'eslint-plugin-vue': 0,
        'dot-notation': 'off'
    }
};
