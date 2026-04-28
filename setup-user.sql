-- Asegurar que estamos en el PDB correcto
ALTER SESSION SET CONTAINER = XEPDB1;

-- Soporte para decimales con coma (según el script)
ALTER SESSION SET NLS_NUMERIC_CHARACTERS = ',.';

-- Crear el usuario si no existe (el error se ignorará si ya existe)
BEGIN
  EXECUTE IMMEDIATE 'CREATE USER TIERRA_EN_CALMA IDENTIFIED BY Tierracalma';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -1918 AND SQLCODE != -1920 THEN
      RAISE;
    END IF;
END;
/

GRANT DBA TO TIERRA_EN_CALMA;
