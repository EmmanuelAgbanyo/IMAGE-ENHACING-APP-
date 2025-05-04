"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  RefreshCw,
  Sun,
  Contrast,
  Droplet,
  Palette,
  CloudyIcon as Blur,
  RotateCw,
  Upload,
  Trash2,
  Sliders,
  Wand2,
  Layers,
  Paintbrush,
  Moon,
  CircleDot,
  Loader2,
} from "lucide-react"

type FilterPreset = {
  name: string
  icon: React.ReactNode
  settings: {
    brightness: number
    contrast: number
    saturation: number
    blur: number
    hue: number
    grayscale: number
    invert: number
    sepia: number
    exposure: number
    vignette: number
  }
}

export default function ImageEnhancer() {
  // Basic adjustments
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [blur, setBlur] = useState(0)
  const [rotation, setRotation] = useState(0)

  // Advanced adjustments
  const [hue, setHue] = useState(0)
  const [grayscale, setGrayscale] = useState(0)
  const [invert, setInvert] = useState(0)
  const [sepia, setSepia] = useState(0)

  // Effects
  const [exposure, setExposure] = useState(100)
  const [highlights, setHighlights] = useState(100)
  const [shadows, setShadows] = useState(100)
  const [vignette, setVignette] = useState(0)
  const [sharpen, setSharpen] = useState(0)
  const [flipHorizontal, setFlipHorizontal] = useState(false)
  const [flipVertical, setFlipVertical] = useState(false)

  // Canvas and image refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageSource, setImageSource] = useState<string>(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1000449926-HtOmgMeznPeLQn6OqZM5piXufPybsy.png",
  )
  const [hasImage, setHasImage] = useState(true)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [renderKey, setRenderKey] = useState(0) // Used to force re-render

  // Filter presets
  const filterPresets: FilterPreset[] = [
    {
      name: "Normal",
      icon: <Sliders size={16} />,
      settings: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        hue: 0,
        grayscale: 0,
        invert: 0,
        sepia: 0,
        exposure: 100,
        vignette: 0,
      },
    },
    {
      name: "Vintage",
      icon: <Droplet size={16} />,
      settings: {
        brightness: 110,
        contrast: 120,
        saturation: 85,
        blur: 0,
        hue: 10,
        grayscale: 0,
        invert: 0,
        sepia: 30,
        exposure: 105,
        vignette: 20,
      },
    },
    {
      name: "B&W",
      icon: <CircleDot size={16} />,
      settings: {
        brightness: 105,
        contrast: 120,
        saturation: 0,
        blur: 0,
        hue: 0,
        grayscale: 100,
        invert: 0,
        sepia: 0,
        exposure: 100,
        vignette: 10,
      },
    },
    {
      name: "Dramatic",
      icon: <Moon size={16} />,
      settings: {
        brightness: 105,
        contrast: 140,
        saturation: 120,
        blur: 0,
        hue: 0,
        grayscale: 0,
        invert: 0,
        sepia: 0,
        exposure: 95,
        vignette: 30,
      },
    },
    {
      name: "Warm",
      icon: <Sun size={16} />,
      settings: {
        brightness: 105,
        contrast: 110,
        saturation: 110,
        blur: 0,
        hue: 15,
        grayscale: 0,
        invert: 0,
        sepia: 20,
        exposure: 105,
        vignette: 0,
      },
    },
    {
      name: "Cool",
      icon: <Blur size={16} />,
      settings: {
        brightness: 100,
        contrast: 105,
        saturation: 90,
        blur: 0,
        hue: 210,
        grayscale: 0,
        invert: 0,
        sepia: 0,
        exposure: 100,
        vignette: 0,
      },
    },
  ]

  const resetFilters = () => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setBlur(0)
    setRotation(0)
    setHue(0)
    setGrayscale(0)
    setInvert(0)
    setSepia(0)
    setExposure(100)
    setHighlights(100)
    setShadows(100)
    setVignette(0)
    setSharpen(0)
    setFlipHorizontal(false)
    setFlipVertical(false)
  }

  const applyPreset = (preset: FilterPreset) => {
    setBrightness(preset.settings.brightness)
    setContrast(preset.settings.contrast)
    setSaturation(preset.settings.saturation)
    setBlur(preset.settings.blur)
    setHue(preset.settings.hue)
    setGrayscale(preset.settings.grayscale)
    setInvert(preset.settings.invert)
    setSepia(preset.settings.sepia)
    setExposure(preset.settings.exposure)
    setVignette(preset.settings.vignette)
  }

  // Resize image to a reasonable size while maintaining aspect ratio
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Set max dimensions
          const MAX_WIDTH = 1200
          const MAX_HEIGHT = 1200

          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width)
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height)
              height = MAX_HEIGHT
            }
          }

          // Create canvas for resizing
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height

          // Draw resized image
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)

            // Get resized image as data URL
            const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.9)
            setImageSize({ width, height })
            resolve(resizedDataUrl)
          } else {
            // If context fails, return original
            resolve(e.target?.result as string)
          }
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Clear previous image reference to force reload
      originalImageRef.current = null

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5
          return newProgress < 90 ? newProgress : prev
        })
      }, 50)

      // Resize image
      const resizedImage = await resizeImage(file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Short delay to show 100% progress
      setTimeout(() => {
        setImageSource(resizedImage)
        setHasImage(true)
        resetFilters()
        setIsUploading(false)

        // Create a new image to ensure it loads properly
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          originalImageRef.current = img
          setIsImageLoaded(true)
          setRenderKey((prev) => prev + 1) // Force re-render
        }
        img.src = resizedImage
      }, 300)
    } catch (error) {
      console.error("Error uploading image:", error)
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    setHasImage(false)
    setIsImageLoaded(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Apply vignette effect to canvas
  const applyVignette = useCallback((ctx: CanvasRenderingContext2D, amount: number) => {
    if (amount <= 0) return

    const canvas = ctx.canvas
    const w = canvas.width
    const h = canvas.height

    // Create radial gradient for vignette
    const gradient = ctx.createRadialGradient(
      w / 2,
      h / 2,
      0,
      w / 2,
      h / 2,
      Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h / 2, 2)),
    )

    // Adjust the gradient stops based on the amount
    const innerRadius = 1 - amount / 200 // Convert 0-100 to a reasonable inner radius
    gradient.addColorStop(0, "rgba(0,0,0,0)")
    gradient.addColorStop(innerRadius, "rgba(0,0,0,0)")
    gradient.addColorStop(1, `rgba(0,0,0,${amount / 100})`)

    // Apply the gradient
    ctx.fillStyle = gradient
    ctx.globalCompositeOperation = "multiply"
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = "source-over"
  }, [])

  // Apply sharpen effect
  const applySharpen = useCallback((ctx: CanvasRenderingContext2D, amount: number) => {
    if (amount <= 0 || !originalImageRef.current) return

    const canvas = ctx.canvas
    const w = canvas.width
    const h = canvas.height

    // Create a temporary canvas for the sharpening effect
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = w
    tempCanvas.height = h
    const tempCtx = tempCanvas.getContext("2d")

    if (!tempCtx) return

    // Draw the original image
    tempCtx.drawImage(originalImageRef.current, 0, 0, w, h)

    // Apply a simple sharpening algorithm
    const imageData = tempCtx.getImageData(0, 0, w, h)
    const data = imageData.data

    // Simple convolution kernel for sharpening
    const strength = (amount / 100) * 0.5 // Scale the effect

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4

        // For each color channel
        for (let c = 0; c < 3; c++) {
          const current = data[idx + c]
          const neighbors =
            (data[idx - w * 4 + c] + // top
              data[idx + w * 4 + c] + // bottom
              data[idx - 4 + c] + // left
              data[idx + 4 + c]) / // right
            4

          // Apply sharpening: enhance the difference between current pixel and neighbors
          data[idx + c] = Math.min(255, Math.max(0, current + (current - neighbors) * strength))
        }
      }
    }

    tempCtx.putImageData(imageData, 0, 0)

    // Draw the sharpened image back to the main canvas
    ctx.drawImage(tempCanvas, 0, 0)
  }, [])

  // Apply exposure adjustment
  const applyExposure = useCallback((ctx: CanvasRenderingContext2D, amount: number) => {
    if (amount === 100 || !originalImageRef.current) return

    const canvas = ctx.canvas
    const w = canvas.width
    const h = canvas.height

    // Create a temporary canvas
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = w
    tempCanvas.height = h
    const tempCtx = tempCanvas.getContext("2d")

    if (!tempCtx) return

    // Draw the current state
    tempCtx.drawImage(canvas, 0, 0)

    // Get image data
    const imageData = tempCtx.getImageData(0, 0, w, h)
    const data = imageData.data

    // Calculate exposure adjustment factor
    const factor = amount / 100

    // Apply exposure adjustment
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * factor) // R
      data[i + 1] = Math.min(255, data[i + 1] * factor) // G
      data[i + 2] = Math.min(255, data[i + 2] * factor) // B
    }

    tempCtx.putImageData(imageData, 0, 0)

    // Draw the adjusted image back to the main canvas
    ctx.drawImage(tempCanvas, 0, 0)
  }, [])

  // Apply highlights and shadows adjustments
  const applyHighlightsShadows = useCallback(
    (ctx: CanvasRenderingContext2D, highlightsValue: number, shadowsValue: number) => {
      if ((highlightsValue === 100 && shadowsValue === 100) || !originalImageRef.current) return

      const canvas = ctx.canvas
      const w = canvas.width
      const h = canvas.height

      // Create a temporary canvas
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = w
      tempCanvas.height = h
      const tempCtx = tempCanvas.getContext("2d")

      if (!tempCtx) return

      // Draw the current state
      tempCtx.drawImage(canvas, 0, 0)

      // Get image data
      const imageData = tempCtx.getImageData(0, 0, w, h)
      const data = imageData.data

      // Calculate adjustment factors
      const highlightsFactor = highlightsValue / 100
      const shadowsFactor = shadowsValue / 100

      // Apply highlights and shadows adjustments
      for (let i = 0; i < data.length; i += 4) {
        // Calculate luminance (simplified)
        const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255

        // Determine if pixel is in highlights or shadows
        let factor
        if (luminance > 0.5) {
          // Highlights
          factor = 1 + (highlightsFactor - 1) * (luminance - 0.5) * 2
        } else {
          // Shadows
          factor = shadowsFactor * luminance * 2
        }

        // Apply adjustment
        data[i] = Math.min(255, Math.max(0, data[i] * factor)) // R
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor)) // G
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor)) // B
      }

      tempCtx.putImageData(imageData, 0, 0)

      // Draw the adjusted image back to the main canvas
      ctx.drawImage(tempCanvas, 0, 0)
    },
    [],
  )

  // Render image with all effects applied
  const renderWithEffects = useCallback(
    (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
      // Apply basic filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) sepia(${sepia}%) hue-rotate(${hue}deg) grayscale(${grayscale}%) invert(${invert}%)`

      // Clear canvas
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

      // Handle rotation and flipping
      ctx.save()
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2)

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180)

      // Apply flipping
      const scaleX = flipHorizontal ? -1 : 1
      const scaleY = flipVertical ? -1 : 1
      ctx.scale(scaleX, scaleY)

      // Draw the image
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.restore()

      // Apply additional effects that aren't part of CSS filters
      applyExposure(ctx, exposure)
      applyHighlightsShadows(ctx, highlights, shadows)
      applySharpen(ctx, sharpen)
      applyVignette(ctx, vignette)
    },
    [
      brightness,
      contrast,
      saturation,
      blur,
      rotation,
      sepia,
      hue,
      grayscale,
      invert,
      exposure,
      highlights,
      shadows,
      vignette,
      sharpen,
      flipHorizontal,
      flipVertical,
      applyExposure,
      applyHighlightsShadows,
      applySharpen,
      applyVignette,
    ],
  )

  const renderImage = useCallback(() => {
    if (!hasImage) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = originalImageRef.current
    if (!img) {
      // Load the image if it's not already loaded
      const newImg = new Image()
      newImg.crossOrigin = "anonymous"
      newImg.src = imageSource

      newImg.onload = () => {
        // Store the original image for reference
        originalImageRef.current = newImg
        setIsImageLoaded(true)

        // Set canvas dimensions to match image
        canvas.width = newImg.width
        canvas.height = newImg.height

        // Render the image with effects
        renderWithEffects(ctx, newImg)
      }
    } else {
      // Image is already loaded, just render with effects
      canvas.width = img.width
      canvas.height = img.height
      renderWithEffects(ctx, img)
    }
  }, [
    hasImage,
    imageSource,
    brightness,
    contrast,
    saturation,
    blur,
    rotation,
    sepia,
    hue,
    grayscale,
    invert,
    exposure,
    highlights,
    shadows,
    vignette,
    sharpen,
    flipHorizontal,
    flipVertical,
    renderKey,
    renderWithEffects,
  ])

  // Effect to render the image when parameters change
  useEffect(() => {
    renderImage()
  }, [renderImage])

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = "enhanced-image.png"
    link.href = dataUrl
    link.click()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Advanced Image Enhancer</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-center mb-6 min-h-[300px] items-center">
            {hasImage ? (
              <>
                {isImageLoaded ? (
                  <canvas ref={canvasRef} className="max-w-full border rounded-lg shadow-sm" />
                ) : (
                  <div className="flex justify-center items-center h-64 w-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 w-full border-2 border-dashed border-gray-300 rounded-lg p-6">
                <Upload size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-500 text-center mb-4">No image selected</p>
                <Button onClick={triggerFileInput} variant="outline" disabled={isUploading}>
                  Upload an Image
                </Button>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing image... {uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="flex justify-between mt-4 gap-2 flex-wrap">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            <Button
              onClick={triggerFileInput}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isUploading}
            >
              <Upload size={16} />
              {hasImage ? "Change Image" : "Upload Image"}
            </Button>

            {hasImage && (
              <>
                <Button
                  onClick={removeImage}
                  variant="destructive"
                  className="flex items-center gap-2"
                  disabled={isUploading}
                >
                  <Trash2 size={16} />
                  Remove Image
                </Button>

                <Button
                  onClick={downloadImage}
                  className="flex items-center gap-2"
                  disabled={!isImageLoaded || isUploading}
                >
                  <Download size={16} />
                  Download
                </Button>
              </>
            )}
          </div>

          {hasImage && isImageLoaded && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Presets</h3>
              <div className="flex flex-wrap gap-2">
                {filterPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-1"
                    disabled={isUploading}
                  >
                    {preset.icon}
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {imageSize.width > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              Image dimensions: {imageSize.width} × {imageSize.height}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Adjustment Controls</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center gap-1"
              disabled={!hasImage || isUploading}
            >
              <RefreshCw size={14} />
              Reset All
            </Button>
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic" className="flex items-center gap-1">
                <Sliders size={14} />
                Basic
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1">
                <Wand2 size={14} />
                Advanced
              </TabsTrigger>
              <TabsTrigger value="effects" className="flex items-center gap-1">
                <Layers size={14} />
                Effects
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sun size={18} className="text-amber-500" />
                  <label className="font-medium">Brightness: {brightness}%</label>
                </div>
                <Slider
                  value={[brightness]}
                  min={0}
                  max={200}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setBrightness(values[0])
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Contrast size={18} className="text-gray-700" />
                  <label className="font-medium">Contrast: {contrast}%</label>
                </div>
                <Slider
                  value={[contrast]}
                  min={0}
                  max={200}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setContrast(values[0])
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Palette size={18} className="text-purple-500" />
                  <label className="font-medium">Saturation: {saturation}%</label>
                </div>
                <Slider
                  value={[saturation]}
                  min={0}
                  max={200}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setSaturation(values[0])
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Blur size={18} className="text-blue-500" />
                  <label className="font-medium">Blur: {blur}px</label>
                </div>
                <Slider
                  value={[blur]}
                  min={0}
                  max={10}
                  step={0.1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setBlur(values[0])
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RotateCw size={18} className="text-green-500" />
                  <label className="font-medium">Rotation: {rotation}°</label>
                </div>
                <Slider
                  value={[rotation]}
                  min={0}
                  max={360}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setRotation(values[0])
                    }
                  }}
                />
              </div>

              <div className="flex gap-8 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="flip-h"
                    checked={flipHorizontal}
                    onCheckedChange={setFlipHorizontal}
                    disabled={!hasImage || isUploading}
                  />
                  <Label htmlFor="flip-h">Flip Horizontal</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="flip-v"
                    checked={flipVertical}
                    onCheckedChange={setFlipVertical}
                    disabled={!hasImage || isUploading}
                  />
                  <Label htmlFor="flip-v">Flip Vertical</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Paintbrush size={18} className="text-orange-500" />
                  <label className="font-medium">Hue Rotation: {hue}°</label>
                </div>
                <Slider
                  value={[hue]}
                  min={0}
                  max={360}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setHue(values[0])
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CircleDot size={18} className="text-gray-500" />
                  <label className="font-medium">Grayscale: {grayscale}%</label>
                </div>
                <Slider
                  value={[grayscale]}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setGrayscale(values[0])
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Contrast size={18} className="text-indigo-500" />
                  <label className="font-medium">Invert: {invert}%</label>
                </div>
                <Slider
                  value={[invert]}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setInvert(values[0])
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Droplet size={18} className="text-amber-700" />
                  <label className="font-medium">Sepia: {sepia}%</label>
                </div>
                <Slider
                  value={[sepia]}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setSepia(values[0])
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sun size={18} className="text-yellow-500" />
                  <label className="font-medium">Exposure: {exposure}%</label>
                </div>
                <Slider
                  value={[exposure]}
                  min={50}
                  max={150}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setExposure(values[0])
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="effects" className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sun size={18} className="text-yellow-400" />
                  <label className="font-medium">Highlights: {highlights}%</label>
                </div>
                <Slider
                  value={[highlights]}
                  min={50}
                  max={150}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setHighlights(values[0])
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Moon size={18} className="text-gray-600" />
                  <label className="font-medium">Shadows: {shadows}%</label>
                </div>
                <Slider
                  value={[shadows]}
                  min={50}
                  max={150}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setShadows(values[0])
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-gray-800" />
                  <label className="font-medium">Vignette: {vignette}%</label>
                </div>
                <Slider
                  value={[vignette]}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setVignette(values[0])
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sliders size={18} className="text-green-600" />
                  <label className="font-medium">Sharpen: {sharpen}%</label>
                </div>
                <Slider
                  value={[sharpen]}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!hasImage || isUploading}
                  onValueChange={(values) => {
                    if (values && values.length > 0) {
                      setSharpen(values[0])
                    }
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
