module.exports = {
    env: {
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ],
    rules: {
        '@typescript-eslint/no-explicit-any': ['warn'],
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                args: 'after-used',
                argsIgnorePattern: '_',
                ignoreRestSiblings: false,
                vars: 'all',
            },
        ],
    },
};
