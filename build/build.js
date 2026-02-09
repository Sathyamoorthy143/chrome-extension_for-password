const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

const browsers = process.argv.slice(2);
const buildAll = browsers.includes('all') || browsers.length === 0;
const isDev = browsers.includes('dev');

const outputDir = path.join(__dirname, '../dist');
const sourceDir = path.join(__dirname, '..');

async function build() {
    console.log('🚀 Building SecureSync Extension...\n');

    // Clean output directory
    await fs.emptyDir(outputDir);

    if (isDev) {
        console.log('📦 Development build - copying files...');
        await buildForBrowser('chrome', false);
        console.log('✅ Development build complete!');
        return;
    }

    const targetBrowsers = buildAll ? ['chrome', 'firefox'] : browsers;

    for (const browser of targetBrowsers) {
        await buildForBrowser(browser, true);
    }

    console.log('\n✅ Build complete!');
}

async function buildForBrowser(browser, createZip) {
    console.log(`\n📦 Building for ${browser}...`);

    const browserDir = path.join(outputDir, browser);
    await fs.ensureDir(browserDir);

    // Copy source files
    await fs.copy(path.join(sourceDir, 'src'), path.join(browserDir, 'src'));
    await fs.copy(path.join(sourceDir, 'icons'), path.join(browserDir, 'icons'), { overwrite: false, errorOnExist: false });

    // Copy appropriate manifest
    const manifestSource = browser === 'firefox'
        ? path.join(sourceDir, 'manifest.firefox.json')
        : path.join(sourceDir, 'manifest.json');

    await fs.copy(manifestSource, path.join(browserDir, 'manifest.json'));

    console.log(`   ✓ Copied source files`);

    // Create ZIP for distribution
    if (createZip) {
        const zipPath = path.join(outputDir, `securesync-${browser}.zip`);
        await createZipArchive(browserDir, zipPath);
        console.log(`   ✓ Created ${browser} package: ${zipPath}`);
    }
}

async function createZipArchive(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', resolve);
        archive.on('error', reject);

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

// Create placeholder icons if they don't exist
async function createPlaceholderIcons() {
    const iconsDir = path.join(sourceDir, 'icons');
    await fs.ensureDir(iconsDir);

    const sizes = [16, 48, 128];
    for (const size of sizes) {
        const iconPath = path.join(iconsDir, `icon${size}.png`);
        if (!await fs.pathExists(iconPath)) {
            console.log(`⚠️  Missing icon: icon${size}.png - please add icons to /icons directory`);
        }
    }
}

// Run build
createPlaceholderIcons().then(() => build()).catch(console.error);
