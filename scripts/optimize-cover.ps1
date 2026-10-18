Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "public/images/albums/nancy-leone-green-saree/cover.png"
$origBytes = [System.IO.File]::ReadAllBytes($srcPath)
$ms = New-Object System.IO.MemoryStream(,$origBytes)
$img = [System.Drawing.Image]::FromStream($ms)

$targetWidth = 1200
$targetHeight = [int]($img.Height * ($targetWidth / $img.Width))

$resized = New-Object System.Drawing.Bitmap $targetWidth, $targetHeight
$g = [System.Drawing.Graphics]::FromImage($resized)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($img, 0, 0, $targetWidth, $targetHeight)

$destPath = Join-Path (Split-Path $srcPath) "cover-opt.png"
$resized.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$resized.Dispose()
$img.Dispose()
$ms.Dispose()

$size = (Get-Item $destPath).Length
Write-Host "Optimized cover created at $destPath : $(($size / 1024 / 1024).ToString('F2')) MB"
