# GPU Binder for Vencord

> Automatically binds Discord to your selected GPU preference and re-applies it after updates.

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📌 Overview

**GPU Binder** is a Vencord plugin that forces Discord to use a specific GPU preference:

- 🚀 High Performance
- 🔋 Power Saving
- ⚙️ System Default

Windows sometimes resets GPU preferences after Discord updates.  
This plugin ensures your selected mode stays applied automatically.

> ⚠️ **Warning**
>
> This plugin modifies the Windows Registry (`HKCU`).
> It overrides any GPU preference set manually via:
>
> `Windows → System → Display → Graphics → Discord`

---

## 🖥 Requirements

- Windows 10 or Windows 11
- Vencord installed **from source** (locally built)
- `pnpm` installed

> Installer builds of Vencord are not supported.

---

## 📦 Installation

### 1️⃣ Navigate to your Vencord source directory

```bash
cd path/to/Vencord/src
```

### 2️⃣ Create `userplugins` folder (if missing)

```bash
mkdir -p userplugins
```

### 3️⃣ Clone this repository

```bash
cd userplugins
git clone https://github.com/UnClide/vencord-gpubinder gpuBinder
```

### 4️⃣ Build Vencord

```bash
cd ../../..
pnpm build
```

### 5️⃣ Restart Vencord

- Press `Ctrl + R`
- Or use: **Vencord → Restart Client**

---

## ⚙️ Usage

1. Open **User Settings**
2. Navigate to **Vencord → Plugins**
3. Find **GpuBinder**
4. Select your preferred GPU mode
5. Restart Discord to ensure changes take effect

That’s it. Your preference will now persist even after updates.

---

## 🔧 How It Works

The plugin:

- Edits the registry key:

```
HKEY_CURRENT_USER\Software\Microsoft\DirectX\UserGpuPreferences
```

- Sets GPU preference for `Discord.exe`
- Reapplies the value if Discord updates reset it

No background services.  
No telemetry.  
No scheduled tasks.

---

## ❗ Important Notes

- ✅ Works only on Windows
- ❌ Not compatible with non-source Vencord installs
- 🔄 Overrides Windows Graphics Settings for Discord
- 🛠 Registry access is limited to `HKCU` (current user only)

---

## 🛡 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for details.
