exports.module = {
    rules: [
        {
            test: /\.tsx?$/,
            loader: '@ts-tools/webpack-loader'
        }
    ]
};

exports.resolve = {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.json']
};
