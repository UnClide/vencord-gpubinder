import { promisify } from "util";
import { exec as childExec } from "child_process";
import { IpcMainInvokeEvent } from "electron";

const exec = promisify(childExec);

/**
 * applyGpuPreference(preference)
 * - preference: number (2-high perf, 1-power saving, 0-system default)
 * - возвращает Promise<boolean>: true если записали/обновили значение, false если изменений не требовалось
 */
export async function applyGpuPreference(_event: IpcMainInvokeEvent, preference: number): Promise<boolean> {
  if (process.platform !== "win32") {
    console.log("[GpuBinder Native] Not running on Windows, skipping registry write.");
    return false;
  }

  console.log("[GpuBinder Native] Incoming preference:", preference, "typeof:", typeof preference);

  // Принудительно преобразуем в число и проверяем
  preference = Number(preference);
  if (isNaN(preference) || ![0, 1, 2].includes(preference)) {
    console.warn("[GpuBinder Native] Invalid preference value, defaulting to 2 (High Performance).");
    preference = 2;
  }
  console.log("[GpuBinder Native] Resolved preference:", preference);

  const discordPath = process.execPath; // полный путь к exe
  const regPath = "HKCU:\\Software\\Microsoft\\DirectX\\UserGpuPreferences";
  const gpuValue = `GpuPreference=${preference};`;
  console.log("[GpuBinder Native] gpuValue:", gpuValue);

  // Экранируем одиночные кавычки для безопасной вставки в PowerShell-строки
  const nameEsc = discordPath.replace(/'/g, "''");
  const valEsc = gpuValue.replace(/'/g, "''");
  const regPathEsc = regPath.replace(/'/g, "''");

  try {
    // Получаем текущее значение (если есть)
    const checkCmd = `powershell -NoProfile -Command "if (Test-Path -Path '${regPathEsc}') { Get-ItemPropertyValue -Path '${regPathEsc}' -Name '${nameEsc}' -ErrorAction SilentlyContinue }"`;
    console.log("[GpuBinder Native] checkCmd:", checkCmd);
    const { stdout: checkOutput, stderr } = await exec(checkCmd);

    // Если stderr непустой — логируем, но продолжаем проверку stdout
    if (stderr) console.warn("[GpuBinder Native] check stderr:", stderr);

    const currentValue = (checkOutput || "").trim();
    console.log("[GpuBinder Native] currentValue (trimmed):", JSON.stringify(currentValue)); // JSON.stringify для видимости whitespace

    if (currentValue !== gpuValue) {
      // Создаём ключ только если не существует, затем пишем значение
      const setCmd = `powershell -NoProfile -Command "if (-not (Test-Path -Path '${regPathEsc}')) { New-Item -Path '${regPathEsc}' | Out-Null }; Set-ItemProperty -Path '${regPathEsc}' -Name '${nameEsc}' -Value '${valEsc}' -Type String -Force"`;
      console.log("[GpuBinder Native] setCmd:", setCmd);
      const { stderr: setErr } = await exec(setCmd);
      if (setErr) console.warn("[GpuBinder Native] set stderr:", setErr);
      console.log("[GpuBinder Native] Registry value written/updated.");
      return true;
    } else {
      console.log("[GpuBinder Native] Desired value already present, no action taken.");
      return false;
    }
  } catch (error) {
    console.error("[GpuBinder Native] Error applying GPU preference:", error);
    throw error;
  }
}