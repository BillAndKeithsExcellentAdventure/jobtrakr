module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'babel-plugin-react-compiler',
        {
          // Configuration options can be added here if needed
          // See: https://react.dev/learn/react-compiler#usage-with-babel
        },
      ],
    ],
  };
};
