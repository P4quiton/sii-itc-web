
import { adaptGradesResponse } from '../utils/gradesAdapter'

const sampleResponse = {
  data: [
    {
      periodo: {
        clave_periodo: '26/2',
        anio: 2026,
        descripcion_periodo: 'Agosto - Diciembre 2026',
      },
      materias: [
        {
          materia: {
            id_grupo: 1001,
            nombre_materia: 'Programación Web',
          },
          calificaiones: [
            { numero_calificacion: 1, calificacion: '95' },
            { numero_calificacion: 2, calificacion: '85' },
            { numero_calificacion: 3, calificacion: null },
          ],
        },
        {
          materia: {
            id_grupo: 1002,
            nombre_materia: 'Bases de Datos',
          },
          calificaiones: [
            { numero_calificacion: 1, calificacion: '78' },
            { numero_calificacion: 2, calificacion: '90' },
          ],
        },
        {
          materia: {
            id_grupo: 1003,
            nombre_materia: 'Redes de Computadoras',
          },
          calificaiones: [
            { numero_calificacion: 1, calificacion: '65' },
            { numero_calificacion: 2, calificacion: null },
          ],
        },
      ],
    },
    {
      periodo: {
        clave_periodo: '26/1',
        anio: 2026,
        descripcion_periodo: 'Enero - Junio 2026',
      },
      materias: [
        {
          materia: {
            id_grupo: 1004,
            nombre_materia: 'Ingeniería de Software',
          },
          calificaiones: [
            { numero_calificacion: 1, calificacion: '92' },
            { numero_calificacion: 2, calificacion: '88' },
          ],
        },
        {
          materia: {
            id_grupo: 1005,
            nombre_materia: 'Sistemas Operativos',
          },
          calificaiones: [
            { numero_calificacion: 1, calificacion: '75' },
            { numero_calificacion: 2, calificacion: '82' },
          ],
        },
      ],
    },
  ],
}

export const gradesPreview = adaptGradesResponse(sampleResponse)
