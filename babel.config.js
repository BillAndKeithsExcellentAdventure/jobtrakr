module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'babel-plugin-react-compiler',
        {
          // Recommended options for production
          // runtimeModule: 'react-compiler-runtime', // Optional: Use if you want to use the runtime module
        },
      ],
    ],
  };
};
