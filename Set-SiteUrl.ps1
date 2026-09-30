param(
    [Parameter(Mandatory = $true)]
    [string]$SiteUrl
)
$ErrorActionPreference = 'Stop'
$ParsedUrl = $null
if (-not [Uri]::TryCreate($SiteUrl, [UriKind]::Absolute, [ref]$ParsedUrl) -or $ParsedUrl.Scheme -ne 'https' -or $ParsedUrl.Query -or $ParsedUrl.Fragment -or $ParsedUrl.UserInfo) {
    throw 'Indiquez une URL HTTPS complete, sans parametres ni fragment.'
}
$SiteUrl = $ParsedUrl.AbsoluteUri.TrimEnd('/') + '/'
$SafeUrl = [System.Security.SecurityElement]::Escape($SiteUrl)
$Encoding = New-Object System.Text.UTF8Encoding($false)
$HtmlPath = Join-Path $PSScriptRoot 'index.html'
$Html = [IO.File]::ReadAllText($HtmlPath)
$Html = [regex]::Replace($Html, '<link\s+rel="canonical"[^>]*>\s*', '')
$Html = $Html.Replace('</head>', ('<link rel="canonical" href="' + $SafeUrl + '">' + "`n</head>"))
[IO.File]::WriteAllText($HtmlPath, $Html, $Encoding)
$Xml = '<?xml version="1.0" encoding="UTF-8"?>' + "`n" + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' + $SafeUrl + '</loc></url></urlset>' + "`n"
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'sitemap.xml'), $Xml, $Encoding)
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'robots.txt'), "User-agent: *`nAllow: /`nSitemap: ${SiteUrl}sitemap.xml`n", $Encoding)
Write-Host "Referencement configure pour $SiteUrl"
