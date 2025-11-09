const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // 👇 Agrega esta regla para que cargue fuentes .ttf correctamente
  config.module.rules.push({
    test: /\.ttf$/,
    loader: 'url-loader',
    include: /node_modules\/(@expo|react-native-vector-icons)/,
  });

  return config;
};
