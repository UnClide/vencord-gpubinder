// src/userplugins/gpuBinder/index.ts
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { Toasts } from "@webpack/common";

// простая схема настроек — НИКАКИХ type-annotated функций здесь
const settings = definePluginSettings({
  gpuPreference: {
    type: OptionType.SELECT,
    description: "Select GPU preference. Note: This plugin overrides the GPU preference configured for Discord in Windows Graphics settings.",
    default: 2,
    options: [
      { label: "High Performance (Discrete GPU)", value: 2 },
      { label: "Power Saving (Integrated GPU)", value: 1 },
      { label: "System Default (Let Windows decide)", value: 0 },
    ],
    // простая JS-функция без аннотаций
    onChange: function (newVal) {
      try {
        console.log("[GpuBinder] onChange: raw newVal:", newVal, "typeof:", typeof newVal);
        // Обеспечиваем, что newVal — число (на случай, если SELECT возвращает объект или строку)
        if (typeof newVal === "object" && newVal !== null && "value" in newVal) {
          newVal = newVal.value;
        } else if (typeof newVal === "string") {
          newVal = parseInt(newVal, 10);
        }
        newVal = Number(newVal);
        if (isNaN(newVal) || ![0, 1, 2].includes(newVal)) {
          console.warn("[GpuBinder] onChange: invalid newVal, defaulting to 2");
          newVal = 2;
        }
        console.log("[GpuBinder] onChange: resolved newVal:", newVal);

        // Динамически получаем native-помощник в рантайме
        var Native = (typeof VencordNative !== "undefined" && VencordNative.pluginHelpers)
          ? VencordNative.pluginHelpers.GpuBinder
          : undefined;

        if (Native && typeof Native.applyGpuPreference === "function") {
          Native.applyGpuPreference(newVal).then(function (applied) {
            if (applied) {
              Toasts.show({
                message: "GPU preference applied. Restart Discord if changes don't take effect.",
                id: "gpubinder-apply-success",
                type: Toasts.Type.SUCCESS,
              });
            } else {
              Toasts.show({
                message: "GPU preference already set. Restart Discord if necessary.",
                id: "gpubinder-apply-nochange",
                type: Toasts.Type.INFO,
              });
            }
          }).catch(function (err) {
            console.error("[GpuBinder] onChange native apply error:", err);
            Toasts.show({
              message: "Failed to apply GPU preference immediately. Restart Discord to apply changes.",
              id: "gpubinder-apply-fail",
              type: Toasts.Type.FAILURE,
            });
          });
        } else {
          Toasts.show({
            message: "Restart Discord to apply GPU changes (native helper not available right now).",
            id: "gpubinder-restart-needed",
            type: Toasts.Type.WARNING,
          });
        }
      } catch (e) {
        console.error("[GpuBinder] onChange error:", e);
        Toasts.show({
          message: "Error handling GPU preference change. Restart Discord to apply changes.",
          id: "gpubinder-onchange-ex",
          type: Toasts.Type.FAILURE,
        });
      }
    },
  },
});

// Очень важно: definePlugin должны быть максимально простыми и статичными.
// name — первое свойство, простая строка.
export default definePlugin({
  name: "GpuBinder",
  description: "Forces Discord to use your preferred GPU and re-applies the setting after updates.",
  authors: [{ name: "unclide", id: "395504896817758210" }],

  settings,

  async start() {
    var PLUGIN_NAME = "GpuBinder";

    // Динамически получаем native helper — НИКАКИХ typeof import(...) или generic кастов
    var Native = (typeof VencordNative !== "undefined" && VencordNative.pluginHelpers)
      ? VencordNative.pluginHelpers.GpuBinder
      : undefined;

    try {
      console.log("[" + PLUGIN_NAME + "] started");
      try { console.log("[" + PLUGIN_NAME + "] settings.store (raw):", settings.store); } catch(e){}

      var raw = (settings && settings.store) ? settings.store.gpuPreference : undefined;
      console.log("[" + PLUGIN_NAME + "] start: raw gpuPreference:", raw, "typeof:", typeof raw);
      // Обеспечиваем, что raw — число (на случай, если хранится объект или строка)
      if (typeof raw === "object" && raw !== null && "value" in raw) {
        raw = raw.value;
      } else if (typeof raw === "string") {
        raw = parseInt(raw, 10);
      }
      var preference = Number(raw);
      if (isNaN(preference) || ![0, 1, 2].includes(preference)) {
        console.warn("[" + PLUGIN_NAME + "] start: invalid preference, defaulting to 2");
        preference = 2;
      }
      console.log("[" + PLUGIN_NAME + "] start: resolved gpuPreference:", preference);

      if (process.platform !== "win32") {
        console.log("[" + PLUGIN_NAME + "] non-windows platform, skipping registry write");
        return;
      }

      if (!Native || typeof Native.applyGpuPreference !== "function") {
        console.warn("[" + PLUGIN_NAME + "] Native helper not available");
        Toasts.show({
          message: "GpuBinder native helper not available. Restart Discord after an update if needed.",
          id: "gpubinder-native-missing",
          type: Toasts.Type.WARNING,
        });
        return;
      }

      try {
        var applied = await Native.applyGpuPreference(preference);
        if (applied) {
          Toasts.show({
            message: "GPU preference applied. Restart Discord if changes don't take effect.",
            id: "gpubinder-start-applied",
            type: Toasts.Type.SUCCESS,
          });
        } else {
          console.log("[" + PLUGIN_NAME + "] no registry change required");
        }
      } catch (err) {
        console.error("[" + PLUGIN_NAME + "] native apply error:", err);
        Toasts.show({
          message: "Failed to apply GPU preference at start. Check console for details.",
          id: "gpubinder-start-fail",
          type: Toasts.Type.FAILURE,
        });
      }
    } catch (err) {
      console.error("[" + PLUGIN_NAME + "] start() unexpected error:", err);
    }
  },
});