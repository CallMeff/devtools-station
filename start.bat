@echo off
set JAVA_HOME=D:\software\jdk-21.0.11
set MAVEN_HOME=D:\software\apache-maven-3.9.16
set PATH=D:\software\jdk-21.0.11\bin;D:\software\apache-maven-3.9.16\bin;%PATH%
echo JAVA_HOME=%JAVA_HOME%
echo Testing Java...
java -version
echo.
echo Testing Maven...
mvn --version
echo.
echo Starting Spring Boot...
cd /d D:\workspace\devtools-station
mvn spring-boot:run
pause
