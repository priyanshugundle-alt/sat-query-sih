@echo off
set "DIR=%~dp0"

:: Check if the user already has a working system JAVA_HOME setup
if not exist "%JAVA_HOME%\bin\java.exe" (
    
    :: Loop through Eclipse Adoptium folders to find any JDK 21 installation dynamically
    for /d %%G in ("C:\Program Files\Eclipse Adoptium\jdk-21*") do (
        if exist "%%G\bin\java.exe" (
            set "JAVA_HOME=%%G"
        )
    )
    
    :: Fail gracefully if no Java 21 was detected anywhere
    if not defined JAVA_HOME (
        echo Error: Java 21 could not be found automatically.
        echo Please set your JAVA_HOME environment variable manually.
        pause
        exit /b 1
    )
)

:: Clean up trailing slash from JAVA_HOME if it exists
if "%JAVA_HOME:~-1%"=="\" set "JAVA_HOME=%JAVA_HOME:~0,-1%"

:: Execute Maven
"%DIR%maven\apache-maven-3.9.6\bin\mvn.cmd" %*