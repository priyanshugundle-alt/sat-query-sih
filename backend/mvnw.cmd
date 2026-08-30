@echo off
set "DIR=%~dp0"
if not exist "%JAVA_HOME%\bin\java.exe" (
    if exist "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
    )
)
if defined JAVA_HOME if "%JAVA_HOME:~-1%"=="\" set "JAVA_HOME=%JAVA_HOME:~0,-1%"
"%DIR%maven\apache-maven-3.9.6\bin\mvn.cmd" %*

