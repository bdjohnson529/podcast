/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  webpack: (config, { isServer }) => {
    // Exclude native binaries from webpack processing
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    })

    // Handle legacy octal escape in ansi-color package
    config.module.rules.push({
      test: /node_modules\/ansi-color\/lib\/ansi-color\.js$/,
      use: {
        loader: 'string-replace-loader',
        options: {
          search: /\\033\[/g,
          replace: '\\u001b[',
          flags: 'g'
        }
      }
    })

    // Exclude fsevents from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        fsevents: false,
      }
    }

    return config
  },
}

module.exports = nextConfig
